(function () {
  function getWalletApi() {
    return window.solRunnerWallet || null;
  }

  function getSnapshot() {
    const api = getWalletApi();

    return {
      connectedWallet: api?.getConnectedWallet?.() || null,
      sessionToken: api?.getSessionToken?.() || null,
      authenticated: api?.isAuthenticated?.() || false,
    };
  }

  function connect() {
    const api = getWalletApi();
    if (!api?.connectWallet) {
      throw new Error("wallet service no disponible");
    }
    return api.connectWallet();
  }

  function disconnect() {
    const api = getWalletApi();
    if (!api?.disconnectWallet) {
      throw new Error("wallet service no disponible");
    }
    return api.disconnectWallet();
  }

  function signIn() {
    const api = getWalletApi();
    if (!api?.signInWithWallet) {
      throw new Error("wallet service no disponible");
    }
    return api.signInWithWallet();
  }

  function startPaidRun(floor) {
    const api = getWalletApi();
    if (!api?.startPaidRun) {
      throw new Error("wallet service no disponible");
    }
    return api.startPaidRun(floor);
  }

  function isAuthenticated() {
    return !!getWalletApi()?.isAuthenticated?.();
  }

  function getSessionToken() {
    return getWalletApi()?.getSessionToken?.() || null;
  }

  function getConnectedWallet() {
    return getWalletApi()?.getConnectedWallet?.() || null;
  }

  function onAuthChanged(callback) {
    if (typeof callback !== "function") return () => {};

    const handler = (event) => callback(event.detail || getSnapshot());
    window.addEventListener("solrunner:auth-changed", handler);

    return () => {
      window.removeEventListener("solrunner:auth-changed", handler);
    };
  }

  window.solRunnerWalletService = {
    connect,
    disconnect,
    signIn,
    startPaidRun,
    isAuthenticated,
    getSessionToken,
    getConnectedWallet,
    getSnapshot,
    onAuthChanged,
  };
})();