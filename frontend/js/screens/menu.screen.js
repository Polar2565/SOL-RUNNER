(function () {
  const refs = {
    menuWalletStatus: () => document.getElementById("menuWalletStatus"),
    menuWalletAddress: () => document.getElementById("menuWalletAddress"),
    menuAuthStatus: () => document.getElementById("menuAuthStatus"),
    menuDisconnectBtn: () => document.getElementById("menuDisconnectBtn"),

    menuFloorValue: () => document.getElementById("menuFloorValue"),
    menuEntryFeeValue: () => document.getElementById("menuEntryFeeValue"),
    menuRewardEstimateValue: () => document.getElementById("menuRewardEstimateValue"),
    menuLossPenaltyValue: () => document.getElementById("menuLossPenaltyValue"),
    menuTargetKillsValue: () => document.getElementById("menuTargetKillsValue"),
  };

  function applyAuthSnapshot(snapshot = {}) {
    const menuWalletStatusEl = refs.menuWalletStatus();
    const menuWalletAddressEl = refs.menuWalletAddress();
    const menuAuthStatusEl = refs.menuAuthStatus();
    const menuDisconnectBtn = refs.menuDisconnectBtn();

    const connectedWallet = snapshot.connectedWallet || null;
    const authenticated = snapshot.authenticated === true;

    if (menuWalletStatusEl) {
      menuWalletStatusEl.textContent = connectedWallet ? "Conectada" : "No conectada";
    }

    if (menuWalletAddressEl) {
      menuWalletAddressEl.textContent = connectedWallet || "-";
    }

    if (menuAuthStatusEl) {
      menuAuthStatusEl.textContent = authenticated ? "Autenticada" : "No autenticada";
    }

    if (menuDisconnectBtn) {
      menuDisconnectBtn.disabled = !connectedWallet && !authenticated;
    }
  }

  function refreshMenuAuth() {
    const snapshot =
      window.solRunnerAuthService?.getSnapshot?.() || {
        connectedWallet: null,
        sessionToken: null,
        authenticated: false,
      };

    applyAuthSnapshot(snapshot);
    return snapshot;
  }

  function applyEconomyPreview(preview, startGameBtn = null) {
    if (!preview) return;

    const floorEl = refs.menuFloorValue();
    const entryEl = refs.menuEntryFeeValue();
    const rewardEl = refs.menuRewardEstimateValue();
    const lossEl = refs.menuLossPenaltyValue();
    const targetEl = refs.menuTargetKillsValue();

    const formatSol =
      window.solRunnerEconomyService?.formatSol ||
      ((value) => `${Number(value || 0).toFixed(4)} SOL`);

    if (floorEl) floorEl.textContent = String(preview.floor);
    if (entryEl) entryEl.textContent = formatSol(preview.entryFeeSol);
    if (rewardEl) rewardEl.textContent = formatSol(preview.rewardAmountSol);
    if (lossEl) lossEl.textContent = formatSol(preview.lossPenaltySol);
    if (targetEl) targetEl.textContent = `${Number(preview.targetKills || 0)} kills`;

    if (startGameBtn) {
      startGameBtn.textContent = `Jugar · ${formatSol(preview.entryFeeSol)}`;
    }
  }

  async function refreshMenuEconomy(floor, startGameBtn = null) {
    const preview = await window.solRunnerEconomyService?.getPreview?.(floor);
    applyEconomyPreview(preview, startGameBtn);
    return preview;
  }

  function bindMenuScreen() {
    if (!window.solRunnerAuthService?.onAuthChanged) return;

    window.solRunnerAuthService.onAuthChanged((snapshot) => {
      applyAuthSnapshot(snapshot);
    });
  }

  function initMenuScreen() {
    bindMenuScreen();
    refreshMenuAuth();
  }

  window.solRunnerMenuScreen = {
    initMenuScreen,
    applyAuthSnapshot,
    refreshMenuAuth,
    applyEconomyPreview,
    refreshMenuEconomy,
  };
})();