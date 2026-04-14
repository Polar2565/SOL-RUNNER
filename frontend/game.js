(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const canvasWrap = document.getElementById("gameCanvasWrap");

  const screens = {
    login: document.getElementById("loginScreen"),
    menu: document.getElementById("menuScreen"),
    game: document.getElementById("gameScreen"),
  };

  const modals = {
    store: document.getElementById("storeModal"),
    oracle: document.getElementById("oracleModal"),
    pause: document.getElementById("pauseModal"),
  };

  const refs = {
    disconnectWalletBtn: document.getElementById("disconnectWalletBtn"),
    startGameBtn: document.getElementById("startGameBtn"),
    openStoreBtn: document.getElementById("openStoreBtn"),
    openOracleBtn: document.getElementById("openOracleBtn"),
    claimRewardBtn: document.getElementById("claimRewardBtn"),
    menuDisconnectBtn: document.getElementById("menuDisconnectBtn"),

    openStoreFromGameBtn: document.getElementById("openStoreFromGameBtn"),
    openOracleFromGameBtn: document.getElementById("openOracleFromGameBtn"),
    backToMenuFromGameBtn: document.getElementById("backToMenuFromGameBtn"),
    pauseGameBtn: document.getElementById("pauseGameBtn"),

    resumeRunBtn: document.getElementById("resumeRunBtn"),
    pauseStoreBtn: document.getElementById("pauseStoreBtn"),
    pauseOracleBtn: document.getElementById("pauseOracleBtn"),
    pauseExitBtn: document.getElementById("pauseExitBtn"),

    closeStoreModalBtn: document.getElementById("closeStoreModalBtn"),
    closeOracleModalBtn: document.getElementById("closeOracleModalBtn"),

    tabCharactersBtn: document.getElementById("tabCharactersBtn"),
    tabWeaponsBtn: document.getElementById("tabWeaponsBtn"),
    tabRelicsBtn: document.getElementById("tabRelicsBtn"),
    tabCharacters: document.getElementById("tabCharacters"),
    tabWeapons: document.getElementById("tabWeapons"),
    tabRelics: document.getElementById("tabRelics"),

    floorLabel: document.getElementById("floorLabel"),
    roomLabel: document.getElementById("roomLabel"),
    killsLabel: document.getElementById("killsLabel"),
    killsTotalLabel: document.getElementById("killsTotalLabel"),
    heartsMeter: document.getElementById("heartsMeter"),
    dashMeter: document.getElementById("dashMeter"),
    runBannerText: document.getElementById("runBannerText"),
    hudHealthText: document.getElementById("hudHealthText"),
  };

  const keys = Object.create(null);

  let profile = loadProfileFromService();
  let pendingReward = loadPendingRewardFromService();
  let activeModal = null;
  let resumeAfterModal = false;
  let currentRun = null;
  let isAbandoningRun = false;
  let isPaused = false;
  let suppressPauseReopen = false;

  const game = {
    running: false,
    lastTs: 0,
    time: 0,
    mouse: { x: 0, y: 0, down: false },
    player: null,
    bullets: [],
    enemies: [],
    enemyProjectiles: [],
    particles: [],
    floatingTexts: [],
    embers: [],
    boss: null,
    arenaTheme: null,
    bossAttackTimer: 0,
    screenShake: 0,
    kills: 0,
    totalKillsRun: 0,
    targetKills: getTargetKills(profile.currentFloor),
    spawnTimer: 0,
    message: "",
    messageTimer: 0,
  };

  function audio() {
    return window.solRunnerAudio || null;
  }

  function playSound(name) {
    const service = audio();
    const fn = service?.[name];

    if (typeof fn === "function") {
      try {
        fn();
      } catch (error) {
        console.warn("Error reproduciendo sonido:", name, error);
      }
    }
  }

  function startFloorMusic() {
    const service = audio();

    try {
      service?.unlockAudio?.();
      service?.startMusicForFloor?.(profile.currentFloor);
      service?.resumeMusic?.();
    } catch (error) {
      console.warn("No se pudo iniciar música:", error);
    }
  }

  function stopFloorMusic() {
    try {
      audio()?.stopMusic?.();
    } catch (error) {
      console.warn("No se pudo detener música:", error);
    }
  }

  function pauseFloorMusic() {
    try {
      audio()?.pauseMusic?.();
    } catch (error) {
      console.warn("No se pudo pausar música:", error);
    }
  }

  function resumeFloorMusic() {
    try {
      audio()?.resumeMusic?.();
    } catch (error) {
      console.warn("No se pudo reanudar música:", error);
    }
  }

  function notify(type, message, duration = 3200) {
    if (window.solRunnerNotify && typeof window.solRunnerNotify[type] === "function") {
      window.solRunnerNotify[type](message, duration);
      return;
    }

    console[type === "error" ? "error" : "log"](message);
  }

  function loadProfileFromService() {
    return (
      window.solRunnerProfileService?.loadProfile?.() || {
        sol: 0.01,
        damage: 1,
        speed: 4,
        armor: 0,
        critChance: 0,
        equippedSkin: "Cordero",
        currentFloor: 1,
        ownedSkins: {
          Cordero: true,
          Sectorio: false,
          Hereje: false,
          "Dios de Sangre": false,
          "Peregrino de Ceniza": false,
          "Monja del Vacío": false,
          "Rey Caído": false,
          "Arcángel Roto": false,
        },
        ownedItems: {
          damageBoost: 0,
          speedBoost: 0,
          armorBoost: 0,
          critBoost: 0,
          splitShot: false,
          focusLens: false,
          bloodCore: false,
          nightVeil: false,
          chainBurst: false,
          emberHeart: false,
          soulMagnet: false,
          glassCannon: false,
        },
      }
    );
  }

  function saveProfileToService(nextProfile) {
    if (window.solRunnerProfileService?.saveProfile) {
      window.solRunnerProfileService.saveProfile(nextProfile);
    }
  }

  function loadPendingRewardFromService() {
    return window.solRunnerProfileService?.loadPendingReward?.() || null;
  }

  function savePendingRewardToService(data) {
    if (window.solRunnerProfileService?.savePendingReward) {
      return window.solRunnerProfileService.savePendingReward(data);
    }

    return data || null;
  }

  function emitProfileChanged() {
    window.dispatchEvent(
      new CustomEvent("solrunner:profile-changed", {
        detail: {
          profile,
          pendingReward,
        },
      })
    );
  }

  function syncProfileState() {
    profile = loadProfileFromService();
    pendingReward = loadPendingRewardFromService();

    try {
      window.solRunnerStoreScreen?.refreshProfileUi?.();
    } catch (error) {
      console.error("Error refrescando store screen:", error);
    }

    refreshMenuEconomyFromScreen();
    syncAuthMirror();
  }

  function subtractLocalSol(amount) {
    const value = Number(amount || 0);
    if (!value || value <= 0) return;

    profile = loadProfileFromService();

    const currentSol = Number(profile.sol || 0);
    profile.sol = Math.max(0, Number((currentSol - value).toFixed(4)));

    saveProfileToService(profile);
    emitProfileChanged();
    syncProfileState();
  }

  function getSessionToken() {
    return (
      window.solRunnerAuthService?.getSessionToken?.() ||
      window.solRunnerWalletService?.getSessionToken?.() ||
      window.solRunnerWallet?.getSessionToken?.() ||
      localStorage.getItem("sessionToken") ||
      ""
    );
  }

  function isAuthenticated() {
    if (window.solRunnerAuthService?.isAuthenticated) {
      return window.solRunnerAuthService.isAuthenticated();
    }

    if (window.solRunnerWalletService?.isAuthenticated) {
      return window.solRunnerWalletService.isAuthenticated();
    }

    if (window.solRunnerWallet?.isAuthenticated) {
      return window.solRunnerWallet.isAuthenticated();
    }

    return !!getSessionToken();
  }

  async function abandonRunOnServer(reason = "abandoned", kills = game.kills, silent = true) {
    const sessionToken = getSessionToken();

    if (!sessionToken || isAbandoningRun) {
      return null;
    }

    isAbandoningRun = true;

    try {
      const response = await fetch("/run/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          kills: Math.max(0, Number(kills) || 0),
          reason,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.message || "No se pudo cerrar la run activa");
      }

      currentRun = null;

      if (!silent) notify("info", "Run cerrada correctamente.");

      return data;
    } catch (error) {
      console.error("Error abandonando run:", error);
      if (!silent) notify("error", error.message || "No se pudo cerrar la run activa.");
      return null;
    } finally {
      isAbandoningRun = false;
    }
  }

  async function abandonActiveRun(reason = "abandoned", options = {}) {
    const silent = options.silent !== false;

    if (!currentRun && !screens.game?.classList.contains("active")) {
      return null;
    }

    const result = await abandonRunOnServer(reason, game.kills, silent);
    currentRun = null;
    return result;
  }

  function getTargetKills(floor) {
    return 50 + (Math.max(1, Number(floor) || 1) - 1) * 25;
  }

  function getEntryFeeForFloorLocal(floor) {
    const safeFloor = Math.max(1, Number(floor) || 1);
    const baseFee = 0.01;
    const multiplier = 1 + (safeFloor - 1) * 0.2;
    return Number((baseFee * multiplier).toFixed(4));
  }

  function getLossPenaltyRateForFloorLocal(floor) {
    const safeFloor = Math.max(1, Number(floor) || 1);
    if (safeFloor <= 2) return 0.1;
    if (safeFloor <= 4) return 0.15;
    if (safeFloor <= 6) return 0.2;
    return 0.25;
  }

  function getLossPenaltyForFloorLocal(floor) {
    return Number(
      (getEntryFeeForFloorLocal(floor) * getLossPenaltyRateForFloorLocal(floor)).toFixed(4)
    );
  }

  function getRoomProgress() {
    const rooms = 7;
    const progress = Math.min(
      rooms,
      Math.floor((game.kills / game.targetKills) * rooms) + 1
    );

    return `${progress}/${rooms}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function addScreenShake(amount) {
    game.screenShake = Math.max(game.screenShake, amount);
  }

  function getBulletColor() {
    switch (profile.equippedSkin) {
      case "Sectorio":
      case "Monja del Vacío":
        return "#b785ff";
      case "Hereje":
      case "Peregrino de Ceniza":
        return "#ffb223";
      case "Dios de Sangre":
      case "Rey Caído":
        return "#ff4251";
      case "Arcángel Roto":
        return "#d5f2ff";
      default:
        return "#d5f2ff";
    }
  }

  function addFloatingText(text, x, y, color = "#fff0e1") {
    game.floatingTexts.push({
      text,
      x,
      y,
      vy: -36,
      life: 0.75,
      maxLife: 0.75,
      color,
    });
  }

  function addParticles(x, y, count, options = {}) {
    const color = options.color || "#ff8a3d";
    const speedMin = options.speedMin || 45;
    const speedMax = options.speedMax || 180;
    const sizeMin = options.sizeMin || 2;
    const sizeMax = options.sizeMax || 5;
    const lifeMin = options.lifeMin || 0.25;
    const lifeMax = options.lifeMax || 0.65;

    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = randomRange(speedMin, speedMax);

      game.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: randomRange(sizeMin, sizeMax),
        life: randomRange(lifeMin, lifeMax),
        maxLife: lifeMax,
        color,
        gravity: options.gravity || 0,
      });
    }
  }

  function addImpact(x, y, color = "#ffb223") {
    addParticles(x, y, 10, {
      color,
      speedMin: 60,
      speedMax: 220,
      sizeMin: 2,
      sizeMax: 4,
      lifeMin: 0.22,
      lifeMax: 0.45,
    });
  }

  function addDeathBurst(x, y, color = "#ff5b2f") {
    addParticles(x, y, 24, {
      color,
      speedMin: 80,
      speedMax: 260,
      sizeMin: 2,
      sizeMax: 6,
      lifeMin: 0.28,
      lifeMax: 0.75,
      gravity: 60,
    });
  }

  function addMuzzleFlash(x, y, angle, color) {
    for (let i = 0; i < 5; i++) {
      const spread = randomRange(-0.4, 0.4);
      const speed = randomRange(80, 170);

      game.particles.push({
        x,
        y,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        size: randomRange(2, 4),
        life: randomRange(0.12, 0.25),
        maxLife: 0.25,
        color,
        gravity: 0,
      });
    }
  }

  function seedEmbers() {
    game.embers = [];

    for (let i = 0; i < 70; i++) {
      game.embers.push({
        x: Math.random() * Math.max(320, canvas?.width || 1000),
        y: Math.random() * Math.max(320, canvas?.height || 600),
        vy: randomRange(-18, -6),
        vx: randomRange(-4, 4),
        size: randomRange(1, 3),
        alpha: randomRange(0.08, 0.26),
      });
    }
  }

  function updateVfx(dt) {
    if (game.screenShake > 0) game.screenShake = Math.max(0, game.screenShake - dt * 18);

    for (let i = game.particles.length - 1; i >= 0; i--) {
      const p = game.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.life -= dt;
      if (p.life <= 0) game.particles.splice(i, 1);
    }

    for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
      const t = game.floatingTexts[i];
      t.y += t.vy * dt;
      t.life -= dt;
      if (t.life <= 0) game.floatingTexts.splice(i, 1);
    }

    for (const ember of game.embers) {
      ember.x += ember.vx * dt;
      ember.y += ember.vy * dt;

      if (ember.y < -20) {
        ember.y = canvas.height + 20;
        ember.x = Math.random() * canvas.width;
      }

      if (ember.x < -20) ember.x = canvas.width + 20;
      if (ember.x > canvas.width + 20) ember.x = -20;
    }
  }

  function getArenaTheme(floor) {
    const themes = [
      {
        name: "Cripta Carmesí",
        tileA: "#170109",
        tileB: "#0e0106",
        wall: "#4a1426",
        glow: "rgba(255,132,15,0.25)",
        flame: "#ffae38",
      },
      {
        name: "Cámara del Vacío",
        tileA: "#0b0617",
        tileB: "#05030d",
        wall: "#27164a",
        glow: "rgba(142,82,255,0.24)",
        flame: "#a85bff",
      },
      {
        name: "Forja Solar",
        tileA: "#1b0c02",
        tileB: "#100601",
        wall: "#57310a",
        glow: "rgba(255,191,64,0.24)",
        flame: "#ffd36a",
      },
    ];

    return themes[(Math.max(1, Number(floor) || 1) - 1) % themes.length];
  }

  function pickEnemyType(floor) {
    const safeFloor = Math.max(1, Number(floor) || 1);
    const roll = Math.random();

    if (safeFloor >= 3 && roll > 0.86) return "shielded";
    if (safeFloor >= 2 && roll > 0.72) return "shooter";
    if (roll > 0.56) return "runner";
    if (roll > 0.38) return "tank";

    return "crawler";
  }

  function createEnemy(type, x, y, floor) {
    const safeFloor = Math.max(1, Number(floor) || 1);

    const templates = {
      crawler: {
        type,
        r: 14,
        hp: 3 + safeFloor * 0.45,
        speed: 78 + safeFloor * 3,
        damage: 8,
        colorA: "#d23922",
        colorB: "#ffb028",
        shootCooldown: 0,
        shield: 0,
      },
      runner: {
        type,
        r: 12,
        hp: 2.4 + safeFloor * 0.35,
        speed: 118 + safeFloor * 4,
        damage: 7,
        colorA: "#ff6b22",
        colorB: "#ffd166",
        shootCooldown: 0,
        shield: 0,
      },
      tank: {
        type,
        r: 20,
        hp: 8 + safeFloor * 1.4,
        speed: 48 + safeFloor * 2,
        damage: 14,
        colorA: "#8b1e1e",
        colorB: "#ff8f2c",
        shootCooldown: 0,
        shield: 0,
      },
      shooter: {
        type,
        r: 15,
        hp: 4 + safeFloor * 0.6,
        speed: 58 + safeFloor * 2,
        damage: 6,
        colorA: "#6f2bd8",
        colorB: "#47d8ff",
        shootCooldown: 1.1,
        shield: 0,
      },
      shielded: {
        type,
        r: 17,
        hp: 5 + safeFloor * 0.8,
        speed: 62 + safeFloor * 2,
        damage: 9,
        colorA: "#1a9b76",
        colorB: "#83ffd7",
        shootCooldown: 0,
        shield: 4 + safeFloor,
      },
    };

    const data = templates[type] || templates.crawler;

    return {
      x,
      y,
      maxHp: data.hp,
      elite: false,
      hitFlash: 0,
      ...data,
    };
  }

  function getBossConfig(floor) {
    const safeFloor = Math.max(1, Number(floor) || 1);
    const index = (safeFloor - 1) % 3;

    if (index === 1) {
      return {
        name: "ORÁCULO ROTO",
        color: "#7d34ff",
        eye: "#4de2ff",
        aura: "rgba(125,52,255,0.2)",
        hp: 120 + safeFloor * 34,
        speed: 44 + safeFloor * 2,
        damage: 16,
        shootInterval: 1.25,
        projectileColor: "#b785ff",
      };
    }

    if (index === 2) {
      return {
        name: "GUARDIÁN SOLAR",
        color: "#d97919",
        eye: "#fff1a8",
        aura: "rgba(255,174,56,0.22)",
        hp: 150 + safeFloor * 42,
        speed: 38 + safeFloor * 2,
        damage: 22,
        shootInterval: 1.65,
        projectileColor: "#ffd36a",
      };
    }

    return {
      name: "HERALDO CARMESÍ",
      color: "#d11414",
      eye: "#ffb223",
      aura: "rgba(255,45,45,0.18)",
      hp: 100 + safeFloor * 32,
      speed: 54 + safeFloor * 2,
      damage: 18,
      shootInterval: 1.45,
      projectileColor: "#ff4251",
    };
  }

  function addEnemyProjectile(x, y, targetX, targetY, speed, damage, color) {
    const angle = Math.atan2(targetY - y, targetX - x);
    addMuzzleFlash(x, y, angle, color);
    playSound("playEnemyShoot");

    game.enemyProjectiles.push({
      x,
      y,
      prevX: x,
      prevY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 5,
      damage,
      ttl: 3,
      color,
      pulse: Math.random() * Math.PI * 2,
    });
  }

  function updateBanner(text) {
    if (refs.runBannerText) refs.runBannerText.textContent = text;
  }

  function refreshMenuAuthFromScreen() {
    try {
      window.solRunnerMenuScreen?.refreshMenuAuth?.();
    } catch (error) {
      console.error("Error refrescando auth del menú:", error);
    }
  }

  async function refreshMenuEconomyFromScreen() {
    if (!window.solRunnerMenuScreen?.refreshMenuEconomy) return;

    try {
      await window.solRunnerMenuScreen.refreshMenuEconomy(
        profile.currentFloor,
        refs.startGameBtn || null
      );
    } catch (error) {
      console.error("Error refrescando economía del menú:", error);
    }
  }

  function setScreen(name) {
    Object.values(screens).forEach((screen) => screen && screen.classList.remove("active"));
    if (screens[name]) screens[name].classList.add("active");

    if (name !== "game") {
      game.running = false;
      isPaused = false;
      closeAllModals();
      stopFloorMusic();
    }

    if (name === "menu") {
      updateBanner("Arena lista");
      refreshMenuAuthFromScreen();
      refreshMenuEconomyFromScreen();
    }
  }

  function openPauseModal() {
    if (!screens.game?.classList.contains("active")) return;

    isPaused = true;
    game.running = false;
    resumeAfterModal = false;
    activeModal = "pause";

    pauseFloorMusic();

    modals.pause?.classList.add("active");
    modals.pause?.setAttribute("aria-hidden", "false");
    updateBanner("Run pausada");
  }

  function resumeRun() {
    if (!screens.game?.classList.contains("active")) return;

    modals.pause?.classList.remove("active");
    modals.pause?.setAttribute("aria-hidden", "true");

    activeModal = null;
    resumeAfterModal = false;
    isPaused = false;
    game.running = true;

    resumeFloorMusic();
    updateBanner(`Piso ${profile.currentFloor} · Sala ${getRoomProgress()}`);
  }

  function openModal(name) {
    if (!modals[name]) return;

    if (name === "pause") {
      openPauseModal();
      return;
    }

    activeModal = name;
    modals[name].classList.add("active");
    modals[name].setAttribute("aria-hidden", "false");

    if (screens.game.classList.contains("active") && game.running && !isPaused) {
      resumeAfterModal = true;
      game.running = false;
      pauseFloorMusic();
    } else {
      resumeAfterModal = false;
    }
  }

  function closeModal(name) {
    if (!modals[name]) return;

    modals[name].classList.remove("active");
    modals[name].setAttribute("aria-hidden", "true");

    if (activeModal === name) activeModal = null;

    if (name === "pause") {
      if (!suppressPauseReopen) resumeRun();
      return;
    }

    if (resumeAfterModal && screens.game.classList.contains("active") && !isPaused) {
      game.running = true;
      resumeFloorMusic();
    }

    if (
      !suppressPauseReopen &&
      isPaused &&
      screens.game.classList.contains("active") &&
      (name === "store" || name === "oracle")
    ) {
      openPauseModal();
    }

    resumeAfterModal = false;
  }

  function closeAllModals() {
    suppressPauseReopen = true;

    Object.keys(modals).forEach((name) => {
      modals[name]?.classList.remove("active");
      modals[name]?.setAttribute("aria-hidden", "true");
    });

    activeModal = null;
    resumeAfterModal = false;
    suppressPauseReopen = false;
  }

  async function exitRunToMenu(reason = "abandoned") {
    game.running = false;
    isPaused = false;
    closeAllModals();
    stopFloorMusic();
    setScreen("menu");
    await abandonActiveRun(reason, { silent: true });
    notify("info", "Run abandonada.");
  }

  function syncAuthMirror() {
    refreshMenuAuthFromScreen();

    const hasSession = isAuthenticated();

    if (refs.startGameBtn) refs.startGameBtn.disabled = !hasSession;
    if (refs.claimRewardBtn) refs.claimRewardBtn.disabled = !hasSession || !pendingReward;
  }

  function syncScreenFromSession() {
    const hasSession = isAuthenticated();
    const isLoginVisible = screens.login.classList.contains("active");
    const isMenuVisible = screens.menu.classList.contains("active");
    const isGameVisible = screens.game.classList.contains("active");

    syncAuthMirror();

    if (!hasSession) {
      closeAllModals();
      game.running = false;
      isPaused = false;
      currentRun = null;
      stopFloorMusic();
      setScreen("login");
      return;
    }

    if (isLoginVisible || (!isMenuVisible && !isGameVisible)) {
      setScreen("menu");
    }
  }

  function resizeCanvas() {
    if (!canvas || !canvasWrap) return;

    const width = Math.max(320, Math.floor(canvasWrap.clientWidth));
    const height = Math.max(320, Math.floor(canvasWrap.clientHeight));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;

      if (game.player) {
        game.player.x = clamp(game.player.x, game.player.r, canvas.width - game.player.r);
        game.player.y = clamp(game.player.y, game.player.r, canvas.height - game.player.r);
      }

      seedEmbers();
    }
  }

  function getPlayerPalette() {
    switch (profile.equippedSkin) {
      case "Sectorio":
        return { skin: "#2d2242", robe: "#351f75", accent: "#ff5b2f", foot: "#c74b2c" };
      case "Hereje":
        return { skin: "#8d1414", robe: "#c71916", accent: "#ffb223", foot: "#ff7c1f" };
      case "Dios de Sangre":
        return { skin: "#5d0909", robe: "#cf1111", accent: "#ffb84d", foot: "#ff7f2a" };
      case "Peregrino de Ceniza":
        return { skin: "#3a2114", robe: "#8d4a1f", accent: "#ffb223", foot: "#d46b25" };
      case "Monja del Vacío":
        return { skin: "#1c1633", robe: "#5b2ca3", accent: "#4de2ff", foot: "#8d6dff" };
      case "Rey Caído":
        return { skin: "#271010", robe: "#6b0f0f", accent: "#ffd36a", foot: "#a8241b" };
      case "Arcángel Roto":
        return { skin: "#ece7d9", robe: "#d8b86a", accent: "#ffffff", foot: "#9a7834" };
      default:
        return { skin: "#f0ddd0", robe: "#f0ddd0", accent: "#201311", foot: "#e2a2a4" };
    }
  }

  function getProjectileCount() {
    const skinMap = {
      Cordero: 1,
      Sectorio: 2,
      Hereje: 3,
      "Dios de Sangre": 5,
      "Peregrino de Ceniza": 2,
      "Monja del Vacío": 3,
      "Rey Caído": 4,
      "Arcángel Roto": 4,
    };

    return (skinMap[profile.equippedSkin] || 1) + (profile.ownedItems?.splitShot ? 1 : 0);
  }

  function getDamageMitigation() {
    let mitigation = 1;

    mitigation -= Number(profile.armor || 0) * 0.03;

    if (profile.ownedItems?.nightVeil) mitigation -= 0.22;
    if (profile.ownedItems?.glassCannon) mitigation += 0.2;

    return clamp(mitigation, 0.45, 1.35);
  }

  function buildPlayer() {
    const armor = Number(profile.armor || 0);
    const glassCannonBonus = profile.ownedItems?.glassCannon ? 4 : 0;

    return {
      x: canvas.width * 0.5,
      y: canvas.height * 0.56,
      r: 18,
      hp: 100 + armor * 6,
      maxHp: 100 + armor * 6,
      damage: Number(profile.damage || 1) + glassCannonBonus,
      moveSpeed: 150 + Number(profile.speed || 4) * 16,
      fireRate: Math.max(0.08, 0.26 - Number(profile.damage || 1) * 0.01),
      fireCooldown: 0,
      invuln: 0,
      walkPhase: 0,
      emberHeartUsed: false,
    };
  }

  function resetRun() {
    resizeCanvas();
    game.player = buildPlayer();
    game.bullets = [];
    game.enemies = [];
    game.enemyProjectiles = [];
    game.particles = [];
    game.floatingTexts = [];
    game.boss = null;
    game.arenaTheme = getArenaTheme(profile.currentFloor);
    game.bossAttackTimer = 0;
    game.screenShake = 0;
    game.kills = 0;
    game.totalKillsRun = 0;
    game.targetKills = getTargetKills(profile.currentFloor);
    game.spawnTimer = 0;
    game.message = `Piso ${profile.currentFloor}`;
    game.messageTimer = 1.2;
    isPaused = false;
    seedEmbers();
    updateBanner("Arena lista");
    updateHud();
  }

  async function startRun() {
    if (!isAuthenticated()) {
      playSound("playError");
      notify("error", "Primero conecta y autentica tu wallet.");
      setScreen("login");
      return;
    }

    const startPaidRunAction =
      window.solRunnerWalletService?.startPaidRun || window.solRunnerWallet?.startPaidRun;

    if (!startPaidRunAction) {
      playSound("playError");
      notify("error", "El sistema de pago de entrada no está disponible.");
      return;
    }

    try {
      await audio()?.unlockAudio?.();

      if (refs.startGameBtn) refs.startGameBtn.disabled = true;

      await abandonRunOnServer("abandoned", 0, true);

      updateBanner("Procesando entrada...");
      notify("info", "Confirma el pago de entrada en Phantom.");

      const runData = await startPaidRunAction(profile.currentFloor);
      currentRun = runData?.run || null;

      const paidEntryFee =
        Number(runData?.paymentConfig?.entryFeeSol) ||
        Number(runData?.run?.entryFeeSol) ||
        0;

      subtractLocalSol(paidEntryFee);

      closeAllModals();
      resetRun();
      setScreen("game");
      game.running = true;
      isPaused = false;
      game.lastTs = 0;

      startFloorMusic();

      addScreenShake(4);
      addParticles(canvas.width * 0.5, canvas.height * 0.5, 40, {
        color: "#ff8a3d",
        speedMin: 40,
        speedMax: 240,
        sizeMin: 2,
        sizeMax: 6,
        lifeMin: 0.25,
        lifeMax: 0.9,
      });

      updateBanner(`Piso ${profile.currentFloor} · Sala 1/7`);
      notify("success", `Entrada pagada: -${paidEntryFee.toFixed(4)} SOL`);
    } catch (error) {
      playSound("playError");
      console.error("Error iniciando run pagada:", error);
      updateBanner("No se pudo iniciar la run");
      notify("error", error.message || "No se pudo procesar el pago de entrada.");
      stopFloorMusic();
      setScreen("menu");
    } finally {
      syncAuthMirror();
    }
  }

  function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    const pad = 36;
    let x = 0;
    let y = 0;

    if (side === 0) {
      x = -pad;
      y = Math.random() * canvas.height;
    } else if (side === 1) {
      x = canvas.width + pad;
      y = Math.random() * canvas.height;
    } else if (side === 2) {
      x = Math.random() * canvas.width;
      y = -pad;
    } else {
      x = Math.random() * canvas.width;
      y = canvas.height + pad;
    }

    const type = pickEnemyType(profile.currentFloor);
    const enemy = createEnemy(type, x, y, profile.currentFloor);
    game.enemies.push(enemy);

    addParticles(x, y, 8, {
      color: enemy.colorB,
      speedMin: 20,
      speedMax: 90,
      sizeMin: 1,
      sizeMax: 3,
      lifeMin: 0.2,
      lifeMax: 0.55,
    });
  }

  function spawnBoss() {
    if (game.boss) return;

    const config = getBossConfig(profile.currentFloor);

    game.boss = {
      x: canvas.width * 0.5,
      y: 92,
      r: 32,
      hp: config.hp,
      maxHp: config.hp,
      speed: config.speed,
      damage: config.damage,
      name: config.name,
      color: config.color,
      eye: config.eye,
      aura: config.aura,
      shootInterval: config.shootInterval,
      projectileColor: config.projectileColor,
      hitFlash: 0,
    };

    game.bossAttackTimer = 0.8;
    game.message = config.name;
    game.messageTimer = 1.8;
    updateBanner(config.name);

    playSound("playBossSpawn");
    addScreenShake(10);
    addParticles(game.boss.x, game.boss.y, 70, {
      color: config.projectileColor,
      speedMin: 70,
      speedMax: 320,
      sizeMin: 2,
      sizeMax: 7,
      lifeMin: 0.35,
      lifeMax: 1.1,
    });
  }

  function shootAt(targetX, targetY) {
    if (!game.player || game.player.fireCooldown > 0 || isPaused || activeModal) return;

    const angle = Math.atan2(targetY - game.player.y, targetX - game.player.x);
    const count = getProjectileCount();
    const spread = count === 1 ? 0 : 0.18;
    const startOffset = -((count - 1) * spread) / 2;
    const bonusDamage = profile.ownedItems?.focusLens ? 1 : 0;
    const bulletColor = getBulletColor();

    playSound("playShoot");
    addMuzzleFlash(game.player.x, game.player.y, angle, bulletColor);

    for (let i = 0; i < count; i++) {
      const a = angle + startOffset + spread * i;
      const speed =
        profile.ownedItems?.focusLens || profile.equippedSkin === "Arcángel Roto" ? 610 : 520;

      let bulletDamage = game.player.damage + bonusDamage;

      const critChance =
        (profile.ownedItems?.focusLens ? 0.16 : 0.05) +
        Number(profile.critChance || 0) * 0.025 +
        (profile.equippedSkin === "Arcángel Roto" ? 0.08 : 0);

      if (Math.random() < critChance) {
        bulletDamage *= profile.ownedItems?.glassCannon ? 2.15 : 1.8;
      }

      game.bullets.push({
        x: game.player.x,
        y: game.player.y,
        prevX: game.player.x,
        prevY: game.player.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: 4,
        damage: bulletDamage,
        ttl: 1.2,
        color: bulletColor,
        glow: profile.ownedItems?.focusLens ? 1.2 : 1,
      });
    }

    game.player.fireCooldown = game.player.fireRate;
  }

  function healOnKill(amount) {
    if (!game.player) return;
    game.player.hp = Math.min(game.player.maxHp, game.player.hp + amount);
  }

  function triggerEmberHeart() {
    if (!game.player) return;

    addScreenShake(10);
    addParticles(game.player.x, game.player.y, 55, {
      color: "#ff7b36",
      speedMin: 90,
      speedMax: 300,
      sizeMin: 2,
      sizeMax: 7,
      lifeMin: 0.25,
      lifeMax: 0.9,
    });

    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const enemy = game.enemies[i];

      if (dist(enemy.x, enemy.y, game.player.x, game.player.y) <= 160) {
        enemy.hp -= 8 + Number(profile.damage || 1);
        enemy.hitFlash = 0.18;
        addFloatingText("EMBER", enemy.x, enemy.y - 20, "#ffb223");
        playSound("playEnemyHit");

        if (enemy.hp <= 0) killEnemy(i, false);
      }
    }

    if (game.boss && dist(game.boss.x, game.boss.y, game.player.x, game.player.y) <= 190) {
      game.boss.hp -= 10 + Number(profile.damage || 1);
      game.boss.hitFlash = 0.18;
      playSound("playEnemyHit");
    }
  }

  function damagePlayer(rawDamage, color = "#ff6b6b") {
    if (!game.player || game.player.invuln > 0) return false;

    const damage = rawDamage * getDamageMitigation();

    game.player.hp -= damage;
    game.player.invuln = 0.55;

    playSound("playPlayerHit");
    addImpact(game.player.x, game.player.y, color);
    addFloatingText(`-${Math.round(damage)}`, game.player.x, game.player.y - 18, "#ff6b6b");
    addScreenShake(6);

    if (
      profile.ownedItems?.emberHeart &&
      !game.player.emberHeartUsed &&
      game.player.hp > 0 &&
      game.player.hp <= game.player.maxHp * 0.35
    ) {
      game.player.emberHeartUsed = true;
      triggerEmberHeart();
    }

    updateHud();

    if (game.player.hp <= 0) {
      onDefeat();
      return true;
    }

    return false;
  }

  function triggerChainBurst(sourceEnemy) {
    if (!profile.ownedItems?.chainBurst || !sourceEnemy) return;

    addParticles(sourceEnemy.x, sourceEnemy.y, 18, {
      color: "#7bdcff",
      speedMin: 70,
      speedMax: 210,
      sizeMin: 2,
      sizeMax: 5,
      lifeMin: 0.2,
      lifeMax: 0.6,
    });

    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const enemy = game.enemies[i];
      if (enemy === sourceEnemy) continue;

      if (dist(enemy.x, enemy.y, sourceEnemy.x, sourceEnemy.y) <= 130) {
        enemy.hp -= 4 + Number(profile.damage || 1);
        enemy.hitFlash = 0.14;
        addFloatingText("CHAIN", enemy.x, enemy.y - 20, "#7bdcff");
        playSound("playEnemyHit");

        if (enemy.hp <= 0) killEnemy(i, false);
      }
    }
  }

  function killEnemy(index, allowChain = true) {
    const enemy = game.enemies[index];
    if (!enemy) return;

    if (allowChain) triggerChainBurst(enemy);

    playSound("playEnemyDeath");
    addDeathBurst(enemy.x, enemy.y, enemy.colorB);
    game.enemies.splice(index, 1);

    game.kills += 1;
    game.totalKillsRun += 1;

    if (profile.ownedItems?.bloodCore) {
      healOnKill(2);
      addParticles(game.player.x, game.player.y, 8, {
        color: "#ff4251",
        speedMin: 20,
        speedMax: 90,
        sizeMin: 2,
        sizeMax: 4,
        lifeMin: 0.2,
        lifeMax: 0.5,
      });
    }

    if (profile.ownedItems?.soulMagnet && game.totalKillsRun % 10 === 0) {
      healOnKill(5);
      addFloatingText("+SOUL", game.player.x, game.player.y - 26, "#83ffd7");
      playSound("playReward");
    }

    updateBanner(`${Math.max(0, game.targetKills - game.kills)} enemigos restantes`);
    updateHud();
  }

  function update(dt) {
    if (!game.player || isPaused) return;

    game.time += dt;
    updateVfx(dt);

    if (game.messageTimer > 0) game.messageTimer -= dt;
    if (game.player.fireCooldown > 0) game.player.fireCooldown -= dt;
    if (game.player.invuln > 0) game.player.invuln -= dt;

    let mx = 0;
    let my = 0;

    if (keys["w"] || keys["arrowup"]) my -= 1;
    if (keys["s"] || keys["arrowdown"]) my += 1;
    if (keys["a"] || keys["arrowleft"]) mx -= 1;
    if (keys["d"] || keys["arrowright"]) mx += 1;

    if (mx || my) {
      const len = Math.hypot(mx, my) || 1;
      mx /= len;
      my /= len;
      game.player.x += mx * game.player.moveSpeed * dt;
      game.player.y += my * game.player.moveSpeed * dt;
      game.player.walkPhase += dt * 12;
    }

    game.player.x = clamp(game.player.x, 28, canvas.width - 28);
    game.player.y = clamp(game.player.y, 92, canvas.height - 46);

    if (game.mouse.down) shootAt(game.mouse.x, game.mouse.y);

    if (!game.boss && game.kills < game.targetKills) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) {
        spawnEnemy();
        game.spawnTimer = Math.max(0.24, 0.72 - profile.currentFloor * 0.03);
      }
    }

    if (!game.boss && game.kills >= game.targetKills) spawnBoss();

    for (let i = game.bullets.length - 1; i >= 0; i--) {
      const b = game.bullets[i];
      b.prevX = b.x;
      b.prevY = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.ttl -= dt;

      if (
        b.ttl <= 0 ||
        b.x < -20 ||
        b.x > canvas.width + 20 ||
        b.y < -20 ||
        b.y > canvas.height + 20
      ) {
        game.bullets.splice(i, 1);
      }
    }

    for (let i = game.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = game.enemyProjectiles[i];
      p.prevX = p.x;
      p.prevY = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.ttl -= dt;
      p.pulse += dt * 8;

      if (
        p.ttl <= 0 ||
        p.x < -40 ||
        p.x > canvas.width + 40 ||
        p.y < -40 ||
        p.y > canvas.height + 40
      ) {
        game.enemyProjectiles.splice(i, 1);
        continue;
      }

      if (dist(p.x, p.y, game.player.x, game.player.y) <= p.r + game.player.r) {
        if (damagePlayer(p.damage, p.color)) return;
        game.enemyProjectiles.splice(i, 1);
      }
    }

    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const e = game.enemies[i];

      if (e.hitFlash > 0) e.hitFlash -= dt;

      const dx = game.player.x - e.x;
      const dy = game.player.y - e.y;
      const len = Math.hypot(dx, dy) || 1;

      e.x += (dx / len) * e.speed * dt;
      e.y += (dy / len) * e.speed * dt;

      if (e.type === "shooter") {
        e.shootCooldown -= dt;

        if (e.shootCooldown <= 0) {
          addEnemyProjectile(
            e.x,
            e.y,
            game.player.x,
            game.player.y,
            230 + profile.currentFloor * 8,
            9 + profile.currentFloor,
            "#7bdcff"
          );

          e.shootCooldown = Math.max(0.65, 1.25 - profile.currentFloor * 0.04);
        }
      }

      for (let j = game.bullets.length - 1; j >= 0; j--) {
        const b = game.bullets[j];

        if (dist(e.x, e.y, b.x, b.y) <= e.r + b.r) {
          playSound("playEnemyHit");

          if (e.shield > 0) {
            e.shield -= b.damage;
            addFloatingText("shield", e.x, e.y - 20, "#83ffd7");
          } else {
            e.hp -= b.damage;
            addFloatingText(String(Math.round(b.damage)), e.x, e.y - 20, "#ffd36a");
          }

          e.hitFlash = 0.12;
          addImpact(b.x, b.y, b.color);
          game.bullets.splice(j, 1);

          if (e.hp <= 0) killEnemy(i, true);
          break;
        }
      }

      if (!game.enemies[i]) continue;

      if (dist(e.x, e.y, game.player.x, game.player.y) <= e.r + game.player.r) {
        if (damagePlayer(e.damage, e.colorB)) return;
      }
    }

    if (game.boss) {
      const b = game.boss;

      if (b.hitFlash > 0) b.hitFlash -= dt;

      const dx = game.player.x - b.x;
      const dy = game.player.y - b.y;
      const len = Math.hypot(dx, dy) || 1;

      b.x += (dx / len) * b.speed * dt;
      b.y += (dy / len) * b.speed * dt;

      game.bossAttackTimer -= dt;

      if (game.bossAttackTimer <= 0) {
        addEnemyProjectile(
          b.x,
          b.y,
          game.player.x,
          game.player.y,
          260 + profile.currentFloor * 10,
          12 + profile.currentFloor * 1.5,
          b.projectileColor
        );

        addScreenShake(2.5);
        game.bossAttackTimer = b.shootInterval;
      }

      for (let j = game.bullets.length - 1; j >= 0; j--) {
        const bullet = game.bullets[j];

        if (dist(b.x, b.y, bullet.x, bullet.y) <= b.r + bullet.r) {
          playSound("playEnemyHit");

          b.hp -= bullet.damage;
          b.hitFlash = 0.12;
          addImpact(bullet.x, bullet.y, bullet.color);
          addFloatingText(String(Math.round(bullet.damage)), b.x, b.y - 34, "#ffd36a");
          game.bullets.splice(j, 1);

          if (b.hp <= 0) {
            playSound("playBossDeath");
            addDeathBurst(b.x, b.y, b.projectileColor);
            addScreenShake(12);
            onBossDefeated();
            return;
          }
        }
      }

      if (dist(b.x, b.y, game.player.x, game.player.y) <= b.r + game.player.r) {
        if (damagePlayer(b.damage, b.projectileColor)) return;
      }
    }

    updateHud();
  }

  function renderHearts() {
    if (!refs.heartsMeter || !game.player) return;

    const hearts = 6;
    const each = game.player.maxHp / hearts;
    let html = "";

    for (let i = 0; i < hearts; i++) {
      const threshold = (i + 1) * each;
      const filled = game.player.hp >= threshold - each / 2;
      html += `<span class="heart ${filled ? "filled" : ""}"></span>`;
    }

    refs.heartsMeter.innerHTML = html;
  }

  function renderDashMeter() {
    if (!refs.dashMeter || !game.player) return;

    const segs = 8;
    let filled = segs;

    if (game.player.fireCooldown > 0 && game.player.fireRate > 0) {
      const ratio = 1 - game.player.fireCooldown / game.player.fireRate;
      filled = Math.max(1, Math.round(ratio * segs));
    }

    let html = "";
    for (let i = 0; i < segs; i++) {
      let cls = "dash-seg";
      if (i < filled - 1) cls += " filled";
      if (i === filled - 1) cls += " filled-2";
      html += `<span class="${cls}"></span>`;
    }

    refs.dashMeter.innerHTML = html;
  }

  function updateHud() {
    if (!game.player) return;

    if (refs.floorLabel) refs.floorLabel.textContent = String(profile.currentFloor);
    if (refs.roomLabel) refs.roomLabel.textContent = getRoomProgress();
    if (refs.killsLabel) refs.killsLabel.textContent = `${game.kills}/${game.targetKills}`;
    if (refs.killsTotalLabel) refs.killsTotalLabel.textContent = String(game.totalKillsRun);

    if (refs.hudHealthText) {
      const hpPercent = clamp(Math.round((game.player.hp / game.player.maxHp) * 100), 0, 100);
      refs.hudHealthText.textContent = `${hpPercent}%`;
    }

    renderHearts();
    renderDashMeter();
  }

  async function registerRunComplete() {
    if (!isAuthenticated()) return;

    try {
      const response = await fetch("/run/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: getSessionToken(),
          kills: game.kills,
          bossDefeated: true,
          floor: profile.currentFloor - 1,
          targetKills: game.targetKills,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        if (data.pendingRun) {
          pendingReward = savePendingRewardToService(data.pendingRun);
          emitProfileChanged();
          syncProfileState();
        }

        throw new Error(data.message || "No se pudo registrar la run");
      }

      currentRun = null;
      pendingReward = savePendingRewardToService(data.run);
      emitProfileChanged();
      syncProfileState();

      playSound("playReward");
      notify(
        "success",
        `Run completada. Reward pendiente: ${Number(data.run.rewardAmountSol).toFixed(4)} SOL`
      );
    } catch (error) {
      playSound("playError");
      notify("error", error.message || "Error registrando la run.");
    }
  }

  async function claimPendingReward() {
    if (!pendingReward) {
      playSound("playError");
      notify("error", "No hay reward pendiente.");
      return;
    }

    if (!isAuthenticated()) {
      playSound("playError");
      notify("error", "No hay sesión activa.");
      return;
    }

    try {
      const response = await fetch("/reward/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: getSessionToken() }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) throw new Error(data.message || "No se pudo reclamar la reward");

      profile = loadProfileFromService();
      window.solRunnerProfileService?.addSol?.(profile, Number(data.rewardAmountSol || 0));

      pendingReward = savePendingRewardToService(null);
      emitProfileChanged();
      syncProfileState();

      playSound("playReward");
      updateBanner(`Reward +${Number(data.rewardAmountSol).toFixed(4)} SOL`);
      notify("success", `Reward enviada: +${Number(data.rewardAmountSol).toFixed(4)} SOL`);
    } catch (error) {
      playSound("playError");
      notify("error", error.message || "Error reclamando reward.");
    }
  }

  function onBossDefeated() {
    game.running = false;
    isPaused = false;

    stopFloorMusic();

    profile.currentFloor += 1;
    saveProfileToService(profile);

    emitProfileChanged();
    syncProfileState();

    updateBanner("Piso completado");
    notify("success", `Piso ${profile.currentFloor - 1} completado.`);

    registerRunComplete();
    setScreen("menu");
  }

  async function onDefeat() {
    game.running = false;
    isPaused = false;

    stopFloorMusic();
    playSound("playPlayerHit");

    const defeatPenalty = getLossPenaltyForFloorLocal(profile.currentFloor);
    const currentSol = Number(profile.sol || 0);
    profile.sol = Math.max(0, Number((currentSol - defeatPenalty).toFixed(4)));

    saveProfileToService(profile);
    emitProfileChanged();
    syncProfileState();

    updateBanner("Run terminada");
    notify("error", `Has caído en la arena. Penalización: -${defeatPenalty.toFixed(4)} SOL`);

    addScreenShake(12);
    setScreen("menu");
    await abandonActiveRun("failed", { silent: true });
  }

  function drawBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const theme = game.arenaTheme || getArenaTheme(profile.currentFloor);
    const tile = 48;

    for (let y = 0; y < canvas.height; y += tile) {
      for (let x = 0; x < canvas.width; x += tile) {
        const even = (x / tile + y / tile) % 2 === 0;
        ctx.fillStyle = even ? theme.tileA : theme.tileB;
        ctx.fillRect(x, y, tile, tile);
      }
    }

    ctx.fillStyle = theme.wall;
    ctx.fillRect(0, 0, canvas.width, 54);
    ctx.fillRect(0, canvas.height - 44, canvas.width, 44);
    ctx.fillRect(0, 0, 50, canvas.height);
    ctx.fillRect(canvas.width - 50, 0, 50, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 2;

    for (let i = 0; i < 8; i++) {
      const wobble = Math.sin(game.time * 1.5 + i) * 2;
      ctx.strokeRect(70 + i * 90, 88 + (i % 2) * 52 + wobble, 34, 34);
    }

    const lights = [
      [66, 72],
      [canvas.width - 66, 72],
      [66, canvas.height - 72],
      [canvas.width - 66, canvas.height - 72],
    ];

    lights.forEach(([lx, ly], index) => {
      const pulse = 44 + Math.sin(game.time * 4 + index) * 5;
      const glow = ctx.createRadialGradient(lx, ly, 4, lx, ly, pulse);
      glow.addColorStop(0, theme.flame);
      glow.addColorStop(0.45, theme.glow);
      glow.addColorStop(1, "rgba(255,132,15,0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, ly, pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = theme.flame;
      ctx.beginPath();
      ctx.arc(lx, ly, 4 + Math.sin(game.time * 8 + index) * 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    for (const ember of game.embers) {
      ctx.save();
      ctx.globalAlpha = ember.alpha;
      ctx.fillStyle = theme.flame;
      ctx.fillRect(ember.x, ember.y, ember.size, ember.size);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 12px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(theme.name.toUpperCase(), canvas.width / 2, canvas.height - 18);
    ctx.restore();
  }

  function drawPixelBody(x, y, scale, palette) {
    const px = [
      "00111100",
      "01111110",
      "01100110",
      "01111110",
      "00111100",
      "00100100",
      "01100110",
      "01000010",
    ];

    for (let row = 0; row < px.length; row++) {
      for (let col = 0; col < px[row].length; col++) {
        if (px[row][col] === "0") continue;

        let color = palette.skin;
        if (row >= 5) color = palette.foot;
        if (row === 2 && (col === 2 || col === 5)) color = palette.accent;

        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x + col * scale), Math.round(y + row * scale), scale, scale);
      }
    }
  }

  function drawPlayer() {
    if (!game.player) return;

    const palette = getPlayerPalette();
    const size = 5;
    const pxWidth = 8 * size;
    const pxHeight = 8 * size;
    const bob = Math.sin(game.player.walkPhase) * 2;

    ctx.save();

    const aura = ctx.createRadialGradient(game.player.x, game.player.y, 4, game.player.x, game.player.y, 42);
    aura.addColorStop(0, "rgba(255,255,255,0.08)");
    aura.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.y, 42, 0, Math.PI * 2);
    ctx.fill();

    if (game.player.invuln > 0) {
      ctx.globalAlpha = 0.58 + Math.sin(game.time * 40) * 0.22;
    }

    drawPixelBody(game.player.x - pxWidth / 2, game.player.y - pxHeight / 2 + bob, size, palette);
    ctx.restore();
  }

  function drawBullets() {
    ctx.save();
    ctx.lineCap = "round";

    for (const bullet of game.bullets) {
      ctx.strokeStyle = bullet.color;
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = 8 * bullet.glow;
      ctx.beginPath();
      ctx.moveTo(bullet.prevX, bullet.prevY);
      ctx.lineTo(bullet.x, bullet.y);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bullet.prevX, bullet.prevY);
      ctx.lineTo(bullet.x, bullet.y);
      ctx.stroke();

      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.r + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const bullet of game.enemyProjectiles) {
      const pulse = Math.sin(bullet.pulse) * 1.5;

      ctx.strokeStyle = bullet.color || "#ff4251";
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(bullet.prevX, bullet.prevY);
      ctx.lineTo(bullet.x, bullet.y);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.fillStyle = bullet.color || "#ff4251";
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.r + pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawEnemy(enemy) {
    const size = enemy.type === "tank" ? 6 : enemy.type === "runner" ? 4 : 5;
    const baseX = enemy.x - 4 * size;
    const baseY = enemy.y - 4 * size + Math.sin(game.time * 6 + enemy.x) * 1.2;

    const px = [
      "00111100",
      "01111110",
      "11111111",
      "11011011",
      "11111111",
      "00111100",
      "01100110",
      "11000011",
    ];

    ctx.save();

    if (enemy.hitFlash > 0) {
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r + 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (enemy.shield > 0) {
      ctx.strokeStyle = "rgba(131,255,215,0.75)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r + 7 + Math.sin(game.time * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let row = 0; row < px.length; row++) {
      for (let col = 0; col < px[row].length; col++) {
        if (px[row][col] === "0") continue;

        ctx.fillStyle =
          enemy.type === "shooter" && row === 2 && (col === 2 || col === 5)
            ? "#4de2ff"
            : row < 2
              ? enemy.colorB
              : enemy.colorA;

        ctx.fillRect(baseX + col * size, baseY + row * size, size, size);
      }
    }

    ctx.restore();
  }

  function drawEnemies() {
    for (const enemy of game.enemies) drawEnemy(enemy);
  }

  function drawBoss() {
    if (!game.boss) return;

    const b = game.boss;
    const auraPulse = Math.sin(game.time * 4) * 8;

    ctx.save();

    ctx.fillStyle = b.aura;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 22 + auraPulse, 0, Math.PI * 2);
    ctx.fill();

    if (b.hitFlash > 0) {
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const bob = Math.sin(game.time * 3) * 3;

    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - 28, b.y - 28 + bob, 56, 56);

    ctx.fillStyle = b.eye;
    ctx.fillRect(b.x - 18, b.y - 14 + bob, 8, 8);
    ctx.fillRect(b.x + 10, b.y - 14 + bob, 8, 8);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(b.x - 18, b.y + 10 + bob, 36, 7);

    const w = 260;
    const ratio = clamp(b.hp / b.maxHp, 0, 1);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(canvas.width / 2 - w / 2, 68, w, 10);

    ctx.fillStyle = b.projectileColor;
    ctx.fillRect(canvas.width / 2 - w / 2, 68, w * ratio, 10);

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "700 12px Georgia";
    ctx.fillText(b.name, canvas.width / 2, 60);

    ctx.restore();
  }

  function drawParticles() {
    for (const p of game.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFloatingTexts() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "700 13px Georgia";

    for (const t of game.floatingTexts) {
      const alpha = clamp(t.life / t.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }

    ctx.restore();
  }

  function drawMessage() {
    if (game.messageTimer <= 0 || !game.message) return;

    ctx.save();
    ctx.textAlign = "center";
    ctx.globalAlpha = clamp(game.messageTimer, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "700 26px Georgia";
    ctx.fillText(game.message, canvas.width / 2, 120);
    ctx.restore();
  }

  function drawIdle() {
    drawBackground();
  }

  function render() {
    if (!ctx || !canvas) return;

    const shake = game.screenShake > 0 ? game.screenShake : 0;
    const sx = shake ? randomRange(-shake, shake) : 0;
    const sy = shake ? randomRange(-shake, shake) : 0;

    ctx.save();
    ctx.translate(sx, sy);

    drawBackground();

    if (game.player) {
      drawBullets();
      drawEnemies();
      drawBoss();
      drawPlayer();
      drawParticles();
      drawFloatingTexts();
      drawMessage();
    }

    ctx.restore();
  }

  function setStoreTab(tab) {
    [refs.tabCharacters, refs.tabWeapons, refs.tabRelics].forEach((panel) => {
      panel?.classList.remove("active");
    });

    [refs.tabCharactersBtn, refs.tabWeaponsBtn, refs.tabRelicsBtn].forEach((btn) => {
      btn?.classList.remove("active");
    });

    if (tab === "characters") {
      refs.tabCharacters?.classList.add("active");
      refs.tabCharactersBtn?.classList.add("active");
    }

    if (tab === "weapons") {
      refs.tabWeapons?.classList.add("active");
      refs.tabWeaponsBtn?.classList.add("active");
    }

    if (tab === "relics") {
      refs.tabRelics?.classList.add("active");
      refs.tabRelicsBtn?.classList.add("active");
    }
  }

  function bindEvents() {
    window.addEventListener("resize", resizeCanvas);

    window.addEventListener(
      "keydown",
      async (event) => {
        const key = event.key.toLowerCase();
        keys[key] = true;

        if (
          key === "arrowup" ||
          key === "arrowdown" ||
          key === "arrowleft" ||
          key === "arrowright" ||
          key === " "
        ) {
          event.preventDefault();
        }

        if (event.key === "Escape") {
          event.preventDefault();

          if (activeModal === "pause") {
            resumeRun();
            return;
          }

          if (activeModal) {
            closeModal(activeModal);
            return;
          }

          if (screens.game.classList.contains("active")) {
            openPauseModal();
          }
        }
      },
      { passive: false }
    );

    window.addEventListener("keyup", (event) => {
      keys[event.key.toLowerCase()] = false;
    });

    window.addEventListener("beforeunload", () => {
      const sessionToken = getSessionToken();
      if (!currentRun || !sessionToken) return;

      const payload = JSON.stringify({
        sessionToken,
        kills: Math.max(0, Number(game.kills) || 0),
        reason: "abandoned",
      });

      navigator.sendBeacon?.(
        "/run/abandon",
        new Blob([payload], { type: "application/json" })
      );
    });

    if (canvas) {
      canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        game.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
        game.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
      });

      canvas.addEventListener("mousedown", (event) => {
        if (event.button !== 0 || isPaused || activeModal) return;

        game.mouse.down = true;

        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

        shootAt(x, y);
      });

      window.addEventListener("mouseup", () => {
        game.mouse.down = false;
      });

      canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    }

    refs.startGameBtn?.addEventListener("click", startRun);

    refs.openStoreBtn?.addEventListener("click", () => openModal("store"));
    refs.openOracleBtn?.addEventListener("click", () => openModal("oracle"));

    refs.openStoreFromGameBtn?.addEventListener("click", () => openModal("store"));
    refs.openOracleFromGameBtn?.addEventListener("click", () => openModal("oracle"));
    refs.pauseGameBtn?.addEventListener("click", openPauseModal);

    refs.resumeRunBtn?.addEventListener("click", resumeRun);

    refs.pauseStoreBtn?.addEventListener("click", () => {
      closeModal("pause");
      isPaused = true;
      pauseFloorMusic();
      openModal("store");
    });

    refs.pauseOracleBtn?.addEventListener("click", () => {
      closeModal("pause");
      isPaused = true;
      pauseFloorMusic();
      openModal("oracle");
    });

    refs.pauseExitBtn?.addEventListener("click", () => {
      void exitRunToMenu("abandoned");
    });

    refs.backToMenuFromGameBtn?.addEventListener("click", () => {
      void exitRunToMenu("abandoned");
    });

    refs.closeStoreModalBtn?.addEventListener("click", () => closeModal("store"));
    refs.closeOracleModalBtn?.addEventListener("click", () => closeModal("oracle"));

    document.querySelectorAll("[data-close-modal='store']").forEach((el) => {
      el.addEventListener("click", () => closeModal("store"));
    });

    document.querySelectorAll("[data-close-modal='oracle']").forEach((el) => {
      el.addEventListener("click", () => closeModal("oracle"));
    });

    document.querySelectorAll("[data-close-modal='pause']").forEach((el) => {
      el.addEventListener("click", resumeRun);
    });

    refs.menuDisconnectBtn?.addEventListener(
      "click",
      () => {
        if (currentRun) void abandonRunOnServer("logout", game.kills, true);
        stopFloorMusic();
      },
      true
    );

    refs.menuDisconnectBtn?.addEventListener("click", () => {
      game.running = false;
      isPaused = false;
      closeAllModals();
      currentRun = null;
      stopFloorMusic();
    });

    refs.claimRewardBtn?.addEventListener("click", claimPendingReward);

    refs.tabCharactersBtn?.addEventListener("click", () => setStoreTab("characters"));
    refs.tabWeaponsBtn?.addEventListener("click", () => setStoreTab("weapons"));
    refs.tabRelicsBtn?.addEventListener("click", () => setStoreTab("relics"));

    window.addEventListener("solrunner:auth-changed", syncScreenFromSession);
    window.addEventListener("solrunner:profile-changed", syncProfileState);
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    resizeCanvas();

    if (!canvas || !ctx) return;

    if (!screens.game.classList.contains("active")) {
      game.time += 0.016;
      updateVfx(0.016);
      drawIdle();
      game.lastTs = ts;
      return;
    }

    if (!game.lastTs) game.lastTs = ts;
    const dt = Math.min(0.032, (ts - game.lastTs) / 1000);
    game.lastTs = ts;

    if (game.running && !activeModal && !isPaused) {
      update(dt);
    } else {
      updateVfx(dt);
    }

    render();
  }

  function bootstrap() {
    syncProfileState();
    resizeCanvas();
    seedEmbers();
    bindEvents();
    resetRun();
    syncScreenFromSession();
    setStoreTab("characters");
    drawIdle();
    refreshMenuAuthFromScreen();
    refreshMenuEconomyFromScreen();
    requestAnimationFrame(loop);
  }

  bootstrap();
})();