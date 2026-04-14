(function () {
  const refs = {
    walletStatus: () => document.getElementById("walletStatus"),
    walletAddress: () => document.getElementById("walletAddress"),
    authStatus: () => document.getElementById("authStatus"),
    connectWalletBtn: () => document.getElementById("connectWalletBtn"),
    disconnectWalletBtn: () => document.getElementById("disconnectWalletBtn"),
  };

  function applyLoginSnapshot(snapshot = {}) {
    const walletStatusEl = refs.walletStatus();
    const walletAddressEl = refs.walletAddress();
    const authStatusEl = refs.authStatus();
    const connectBtn = refs.connectWalletBtn();
    const disconnectBtn = refs.disconnectWalletBtn();

    const connectedWallet = snapshot.connectedWallet || null;
    const authenticated = snapshot.authenticated === true;

    if (walletStatusEl) {
      walletStatusEl.textContent = connectedWallet ? "Conectada" : "No conectada";
    }

    if (walletAddressEl) {
      walletAddressEl.textContent = connectedWallet || "-";
    }

    if (authStatusEl) {
      authStatusEl.textContent = authenticated ? "Autenticada" : "No autenticada";
    }

    if (connectBtn) {
      connectBtn.disabled = authenticated;
    }

    if (disconnectBtn) {
      disconnectBtn.disabled = !connectedWallet && !authenticated;
    }
  }

  function getCurrentSnapshot() {
    return (
      window.solRunnerAuthService?.getSnapshot?.() || {
        connectedWallet: null,
        sessionToken: null,
        authenticated: false,
      }
    );
  }

  function refreshLoginScreen() {
    const snapshot = getCurrentSnapshot();
    applyLoginSnapshot(snapshot);
    return snapshot;
  }

  function bindLoginScreen() {
    if (!window.solRunnerAuthService?.onAuthChanged) return;

    window.solRunnerAuthService.onAuthChanged((snapshot) => {
      applyLoginSnapshot(snapshot);
    });
  }

  function initLoginScreen() {
    bindLoginScreen();
    refreshLoginScreen();
  }

  window.solRunnerLoginScreen = {
    initLoginScreen,
    refreshLoginScreen,
    applyLoginSnapshot,
  };
})();