(function () {
  const refs = {
    dailyRewardBtn: () => document.getElementById("dailyRewardBtn"),
    spinOracleBtn: () => document.getElementById("spinOracleBtn"),
    oracleWheel: () => document.getElementById("oracleWheel"),
    oracleMessage: () => document.getElementById("oracleMessage"),
  };

  let isSpinning = false;
  let wheelRotation = 0;

  const REWARDS = [
    { type: "sol", amount: 0.0015, label: "+0.0015 SOL", weight: 28 },
    { type: "sol", amount: 0.0025, label: "+0.0025 SOL", weight: 18 },
    { type: "damage", amount: 1, label: "Daño +1", weight: 16 },
    { type: "speed", amount: 1, label: "Velocidad +1", weight: 14 },
    { type: "armor", amount: 1, label: "Armadura +1", weight: 10 },
    { type: "crit", amount: 1, label: "Crítico +1", weight: 8 },
    { type: "item", itemKey: "soulMagnet", label: "Soul Magnet desbloqueado", weight: 3 },
    { type: "item", itemKey: "emberHeart", label: "Ember Heart desbloqueado", weight: 2 },
    { type: "skin", skinName: "Peregrino de Ceniza", label: "Skin: Peregrino de Ceniza", weight: 1 },
  ];

  function notify(type, message, duration = 3200) {
    if (window.solRunnerNotify && typeof window.solRunnerNotify[type] === "function") {
      window.solRunnerNotify[type](message, duration);
      return;
    }

    console[type === "error" ? "error" : "log"](message);
  }

  function getProfileService() {
    return window.solRunnerProfileService || null;
  }

  function loadProfile() {
    return getProfileService()?.loadProfile?.() || null;
  }

  function todayKey() {
    return getProfileService()?.todayKey?.() || new Date().toISOString().slice(0, 10);
  }

  function yesterdayKey() {
    const date = new Date();
    date.setDate(date.getDate() - 1);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  }

  function updateBanner(text) {
    const banner = document.getElementById("runBannerText");
    if (banner) banner.textContent = text;
  }

  function emitProfileChanged() {
    window.dispatchEvent(
      new CustomEvent("solrunner:profile-changed", {
        detail: {
          profile: loadProfile(),
          pendingReward: getProfileService()?.loadPendingReward?.() || null,
        },
      })
    );
  }

  function getAvailableRewards(profile) {
    return REWARDS.filter((reward) => {
      if (reward.type === "item") {
        return !profile.ownedItems?.[reward.itemKey];
      }

      if (reward.type === "skin") {
        return !profile.ownedSkins?.[reward.skinName];
      }

      return true;
    });
  }

  function pickWeightedReward(profile) {
    const available = getAvailableRewards(profile);
    const pool = available.length ? available : REWARDS.filter((reward) => reward.type === "sol");

    const totalWeight = pool.reduce((sum, reward) => sum + Number(reward.weight || 0), 0);
    let roll = Math.random() * totalWeight;

    for (const reward of pool) {
      roll -= Number(reward.weight || 0);
      if (roll <= 0) return reward;
    }

    return pool[0];
  }

  function setMessage(text) {
    const messageEl = refs.oracleMessage();
    if (messageEl) messageEl.textContent = text;
  }

  function animateWheel() {
    const wheel = refs.oracleWheel();
    if (!wheel) return;

    wheelRotation += 1080 + Math.floor(Math.random() * 720);

    wheel.classList.add("spinning");
    wheel.style.transition = "transform 1.9s cubic-bezier(0.16, 1, 0.3, 1)";
    wheel.style.transform = `rotate(${wheelRotation}deg)`;
  }

  function stopWheel() {
    const wheel = refs.oracleWheel();
    if (!wheel) return;

    wheel.classList.remove("spinning");
  }

  function refreshOracleUi() {
    const profile = loadProfile();
    if (!profile) return;

    const today = todayKey();

    const dailyBtn = refs.dailyRewardBtn();
    const spinBtn = refs.spinOracleBtn();

    if (dailyBtn) {
      const claimed = profile.dailyClaimDay === today;
      const streak = Number(profile.dailyStreak || 0);

      dailyBtn.disabled = claimed;
      dailyBtn.textContent = claimed
        ? `Ofrenda reclamada (${streak} días)`
        : "Ofrenda diaria";
    }

    if (spinBtn) {
      const spun = profile.oracleSpinDay === today;

      spinBtn.disabled = spun || isSpinning;
      spinBtn.textContent = spun ? "Consultado hoy" : "Consultar";
    }
  }

  function claimDailyReward() {
    const profileService = getProfileService();
    const profile = loadProfile();

    if (!profile || !profileService) return;

    const today = todayKey();

    if (profile.dailyClaimDay === today) {
      notify("error", "La ofrenda diaria ya fue reclamada hoy.");
      refreshOracleUi();
      return;
    }

    const yesterday = yesterdayKey();
    const previousStreak = Number(profile.dailyStreak || 0);

    profile.dailyStreak =
      profile.lastDailyClaimDay === yesterday ? previousStreak + 1 : 1;

    profile.lastDailyClaimDay = today;

    const streakBonus = Math.min(profile.dailyStreak - 1, 6) * 0.0003;
    const amount = Number((0.0015 + streakBonus).toFixed(4));

    const result = profileService.applyDailyReward(profile, amount);

    if (!result?.ok) {
      notify("error", "La ofrenda diaria ya fue reclamada hoy.");
      refreshOracleUi();
      return;
    }

    updateBanner(`Ofrenda diaria: +${amount.toFixed(4)} SOL`);
    setMessage(`Ofrenda reclamada: +${amount.toFixed(4)} SOL · Racha ${profile.dailyStreak}`);
    notify("success", `Ofrenda diaria: +${amount.toFixed(4)} SOL`);
    emitProfileChanged();
    refreshOracleUi();
  }

  function spinOracle() {
    const profileService = getProfileService();
    const profile = loadProfile();

    if (!profile || !profileService || isSpinning) return;

    const markResult = profileService.markOracleSpin(profile);

    if (!markResult?.ok) {
      notify("error", "El oráculo ya fue consultado hoy.");
      refreshOracleUi();
      return;
    }

    isSpinning = true;
    refreshOracleUi();
    setMessage("El oráculo está decidiendo tu destino...");
    animateWheel();

    window.setTimeout(() => {
      const freshProfile = loadProfile();
      const reward = pickWeightedReward(freshProfile);

      profileService.applyOracleReward(freshProfile, reward);

      const message = `Recompensa del oráculo: ${reward.label}`;

      setMessage(message);
      updateBanner(message);
      stopWheel();

      isSpinning = false;
      notify("success", message);
      emitProfileChanged();
      refreshOracleUi();
    }, 1950);
  }

  function bindOracleScreen() {
    refs.dailyRewardBtn()?.addEventListener("click", claimDailyReward);
    refs.spinOracleBtn()?.addEventListener("click", spinOracle);

    window.addEventListener("solrunner:profile-changed", refreshOracleUi);
    window.addEventListener("solrunner:auth-changed", refreshOracleUi);
  }

  function initOracleScreen() {
    bindOracleScreen();
    refreshOracleUi();
  }

  window.solRunnerOracleScreen = {
    initOracleScreen,
    claimDailyReward,
    spinOracle,
    refreshOracleUi,
  };
})();