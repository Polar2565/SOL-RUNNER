(function () {
  function getWalletService() {
    return window.solRunnerWalletService || null;
  }

  function getSnapshot() {
    const walletService = getWalletService();

    return {
      connectedWallet: walletService?.getConnectedWallet?.() || null,
      sessionToken: walletService?.getSessionToken?.() || null,
      authenticated: walletService?.isAuthenticated?.() || false,
    };
  }

  async function connectAndAuthenticate() {
    const walletService = getWalletService();

    if (!walletService?.connect) {
      throw new Error("auth service no disponible");
    }

    await walletService.connect();
    return getSnapshot();
  }

  async function disconnectSession() {
    const walletService = getWalletService();

    if (!walletService?.disconnect) {
      throw new Error("auth service no disponible");
    }

    await walletService.disconnect();
    return getSnapshot();
  }

  async function revalidateSession() {
    const walletService = getWalletService();

    if (!walletService?.signIn) {
      throw new Error("auth service no disponible");
    }

    await walletService.signIn();
    return getSnapshot();
  }

  function isAuthenticated() {
    return !!getWalletService()?.isAuthenticated?.();
  }

  function getSessionToken() {
    return getWalletService()?.getSessionToken?.() || null;
  }

  function getConnectedWallet() {
    return getWalletService()?.getConnectedWallet?.() || null;
  }

  function onAuthChanged(callback) {
    const walletService = getWalletService();

    if (!walletService?.onAuthChanged || typeof callback !== "function") {
      return () => {};
    }

    return walletService.onAuthChanged(callback);
  }

  window.solRunnerAuthService = {
    connectAndAuthenticate,
    disconnectSession,
    revalidateSession,
    isAuthenticated,
    getSessionToken,
    getConnectedWallet,
    getSnapshot,
    onAuthChanged,
  };
})();