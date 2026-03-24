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
  };

  const refs = {
    connectWalletBtn: document.getElementById("connectWalletBtn"),
    disconnectWalletBtn: document.getElementById("disconnectWalletBtn"),
    walletStatus: document.getElementById("walletStatus"),
    walletAddress: document.getElementById("walletAddress"),
    authStatus: document.getElementById("authStatus"),

    menuWalletStatus: document.getElementById("menuWalletStatus"),
    menuWalletAddress: document.getElementById("menuWalletAddress"),
    menuAuthStatus: document.getElementById("menuAuthStatus"),

    startGameBtn: document.getElementById("startGameBtn"),
    openStoreBtn: document.getElementById("openStoreBtn"),
    openOracleBtn: document.getElementById("openOracleBtn"),
    claimRewardBtn: document.getElementById("claimRewardBtn"),
    menuDisconnectBtn: document.getElementById("menuDisconnectBtn"),

    openStoreFromGameBtn: document.getElementById("openStoreFromGameBtn"),
    openOracleFromGameBtn: document.getElementById("openOracleFromGameBtn"),
    backToMenuFromGameBtn: document.getElementById("backToMenuFromGameBtn"),

    closeStoreModalBtn: document.getElementById("closeStoreModalBtn"),
    closeOracleModalBtn: document.getElementById("closeOracleModalBtn"),

    tabCharactersBtn: document.getElementById("tabCharactersBtn"),
    tabWeaponsBtn: document.getElementById("tabWeaponsBtn"),
    tabRelicsBtn: document.getElementById("tabRelicsBtn"),

    tabCharacters: document.getElementById("tabCharacters"),
    tabWeapons: document.getElementById("tabWeapons"),
    tabRelics: document.getElementById("tabRelics"),

    buySkinLambBtn: document.getElementById("buySkinLambBtn"),
    buySkinVoidBtn: document.getElementById("buySkinVoidBtn"),
    buySkinSolarBtn: document.getElementById("buySkinSolarBtn"),
    buySkinBloodBtn: document.getElementById("buySkinBloodBtn"),

    skinLambCard: document.getElementById("skinLambCard"),
    skinVoidCard: document.getElementById("skinVoidCard"),
    skinSolarCard: document.getElementById("skinSolarCard"),
    skinBloodCard: document.getElementById("skinBloodCard"),

    skinLambState: document.getElementById("skinLambState"),
    skinVoidState: document.getElementById("skinVoidState"),
    skinSolarState: document.getElementById("skinSolarState"),
    skinBloodState: document.getElementById("skinBloodState"),

    buyDamageBtn: document.getElementById("buyDamageBtn"),
    buySpeedBtn: document.getElementById("buySpeedBtn"),
    buySplitShotBtn: document.getElementById("buySplitShotBtn"),
    buyFocusLensBtn: document.getElementById("buyFocusLensBtn"),
    buyBloodCoreBtn: document.getElementById("buyBloodCoreBtn"),
    buyNightVeilBtn: document.getElementById("buyNightVeilBtn"),

    dailyRewardBtn: document.getElementById("dailyRewardBtn"),
    spinOracleBtn: document.getElementById("spinOracleBtn"),
    oracleWheel: document.getElementById("oracleWheel"),
    oracleMessage: document.getElementById("oracleMessage"),

    floorLabel: document.getElementById("floorLabel"),
    roomLabel: document.getElementById("roomLabel"),
    killsLabel: document.getElementById("killsLabel"),
    killsTotalLabel: document.getElementById("killsTotalLabel"),
    heartsMeter: document.getElementById("heartsMeter"),
    dashMeter: document.getElementById("dashMeter"),

    coinsLabel: document.getElementById("coinsLabel"),
    coinsLabelTop: document.getElementById("coinsLabelTop"),
    storeSolLabel: document.getElementById("storeSolLabel"),
    rewardStatus: document.getElementById("rewardStatus"),
    equippedSkinLabel: document.getElementById("equippedSkinLabel"),
    damageLabel: document.getElementById("damageLabel"),
    speedLabel: document.getElementById("speedLabel"),
    runBannerText: document.getElementById("runBannerText"),

    ownedSkinsCountLabel: document.getElementById("ownedSkinsCountLabel"),
    equippedSkinStoreLabel: document.getElementById("equippedSkinStoreLabel"),
  };

  const STORAGE_KEY = "sol_runner_profile_v5";
  const PENDING_REWARD_KEY = "sol_runner_pending_reward_v5";

  const DEFAULT_PROFILE = {
    sol: 0.01,
    damage: 1,
    speed: 4,
    equippedSkin: "Cordero",
    currentFloor: 1,
    dailyClaimDay: "",
    oracleSpinDay: "",
    ownedSkins: {
      Cordero: true,
      Sectorio: false,
      Hereje: false,
      "Dios de Sangre": false,
    },
    ownedItems: {
      damageBoost: 0,
      speedBoost: 0,
      splitShot: false,
      focusLens: false,
      bloodCore: false,
      nightVeil: false,
    },
  };

  const keys = Object.create(null);

  let profile = loadProfile();
  let pendingReward = loadPendingReward();
  let activeModal = null;
  let resumeAfterModal = false;

  const game = {
    running: false,
    lastTs: 0,
    mouse: { x: 0, y: 0, down: false },
    player: null,
    bullets: [],
    enemies: [],
    boss: null,
    kills: 0,
    totalKillsRun: 0,
    targetKills: getTargetKills(profile.currentFloor),
    spawnTimer: 0,
    message: "",
    messageTimer: 0,
  };

  function loadProfile() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!raw) return structuredProfile(DEFAULT_PROFILE);

      const merged = structuredProfile({
        ...DEFAULT_PROFILE,
        ...raw,
        ownedSkins: {
          ...DEFAULT_PROFILE.ownedSkins,
          ...(raw.ownedSkins || {}),
        },
        ownedItems: {
          ...DEFAULT_PROFILE.ownedItems,
          ...(raw.ownedItems || {}),
        },
      });

      if (merged.equippedSkin && !merged.ownedSkins[merged.equippedSkin]) {
        merged.ownedSkins[merged.equippedSkin] = true;
      }

      return merged;
    } catch {
      return structuredProfile(DEFAULT_PROFILE);
    }
  }

  function structuredProfile(data) {
    return {
      ...data,
      ownedSkins: { ...data.ownedSkins },
      ownedItems: { ...data.ownedItems },
    };
  }

  function saveProfile() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  function loadPendingReward() {
    try {
      const raw = localStorage.getItem(PENDING_REWARD_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function savePendingReward(data) {
    pendingReward = data || null;
    if (pendingReward) {
      localStorage.setItem(PENDING_REWARD_KEY, JSON.stringify(pendingReward));
    } else {
      localStorage.removeItem(PENDING_REWARD_KEY);
    }
  }

  function getSessionToken() {
    return localStorage.getItem("sessionToken") || "";
  }

  function isAuthenticated() {
    return !!getSessionToken();
  }

  function todayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getTargetKills(floor) {
    return 50 + (Math.max(1, floor) - 1) * 25;
  }

  function getRoomProgress() {
    const rooms = 7;
    const progress = Math.min(rooms, Math.floor((game.kills / game.targetKills) * rooms) + 1);
    return `${progress}/${rooms}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function countOwnedSkins() {
    return Object.values(profile.ownedSkins).filter(Boolean).length;
  }

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.textContent = message;

    Object.assign(toast.style, {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      zIndex: "9999",
      minWidth: "250px",
      maxWidth: "360px",
      padding: "14px 16px",
      borderRadius: "14px",
      fontFamily: "Georgia, serif",
      fontSize: "14px",
      color: "#fff4e6",
      background:
        type === "error"
          ? "rgba(120, 23, 18, 0.96)"
          : type === "success"
          ? "rgba(2, 74, 48, 0.96)"
          : "rgba(16, 4, 10, 0.96)",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
      opacity: "0",
      transform: "translateY(10px)",
      transition: "all 160ms ease",
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 180);
    }, 2400);
  }

  function updateBanner(text) {
    if (refs.runBannerText) refs.runBannerText.textContent = text;
  }

  function setScreen(name) {
    Object.values(screens).forEach((screen) => screen && screen.classList.remove("active"));
    if (screens[name]) screens[name].classList.add("active");

    if (name !== "game") {
      game.running = false;
    }

    if (name === "menu") {
      updateBanner("Arena lista");
    }
  }

  function openModal(name) {
    if (!modals[name]) return;
    activeModal = name;
    modals[name].classList.add("active");
    modals[name].setAttribute("aria-hidden", "false");

    if (screens.game.classList.contains("active") && game.running) {
      resumeAfterModal = true;
      game.running = false;
    } else {
      resumeAfterModal = false;
    }
  }

  function closeModal(name) {
    if (!modals[name]) return;
    modals[name].classList.remove("active");
    modals[name].setAttribute("aria-hidden", "true");

    if (activeModal === name) {
      activeModal = null;
    }

    if (resumeAfterModal && screens.game.classList.contains("active")) {
      game.running = true;
    }
    resumeAfterModal = false;
  }

  function closeAllModals() {
    closeModal("store");
    closeModal("oracle");
  }

  function syncAuthMirror() {
    if (refs.menuWalletStatus) refs.menuWalletStatus.textContent = refs.walletStatus?.textContent || "-";
    if (refs.menuWalletAddress) refs.menuWalletAddress.textContent = refs.walletAddress?.textContent || "-";
    if (refs.menuAuthStatus) refs.menuAuthStatus.textContent = refs.authStatus?.textContent || "-";

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
      setScreen("login");
      return;
    }

    if (isLoginVisible || (!isMenuVisible && !isGameVisible)) {
      setScreen("menu");
    }
  }

  function observeNode(node, callback) {
    if (!node) return;
    const observer = new MutationObserver(callback);
    observer.observe(node, {
      childList: true,
      subtree: true,
      characterData: true,
    });
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
    }
  }

  function getPlayerPalette() {
    switch (profile.equippedSkin) {
      case "Sectorio":
        return {
          skin: "#2d2242",
          robe: "#351f75",
          accent: "#ff5b2f",
          foot: "#c74b2c",
        };
      case "Hereje":
        return {
          skin: "#8d1414",
          robe: "#c71916",
          accent: "#ffb223",
          foot: "#ff7c1f",
        };
      case "Dios de Sangre":
        return {
          skin: "#5d0909",
          robe: "#cf1111",
          accent: "#ffb84d",
          foot: "#ff7f2a",
        };
      default:
        return {
          skin: "#f0ddd0",
          robe: "#f0ddd0",
          accent: "#201311",
          foot: "#e2a2a4",
        };
    }
  }

  function getProjectileCount() {
    const skinMap = {
      Cordero: 1,
      Sectorio: 2,
      Hereje: 3,
      "Dios de Sangre": 5,
    };
    const base = skinMap[profile.equippedSkin] || 1;
    return base + (profile.ownedItems.splitShot ? 1 : 0);
  }

  function buildPlayer() {
    return {
      x: canvas.width * 0.5,
      y: canvas.height * 0.56,
      r: 18,
      hp: 100,
      maxHp: 100,
      damage: profile.damage,
      moveSpeed: 150 + profile.speed * 16,
      fireRate: Math.max(0.09, 0.26 - profile.damage * 0.01),
      fireCooldown: 0,
      invuln: 0,
    };
  }

  function resetRun() {
    resizeCanvas();
    game.player = buildPlayer();
    game.bullets = [];
    game.enemies = [];
    game.boss = null;
    game.kills = 0;
    game.totalKillsRun = 0;
    game.targetKills = getTargetKills(profile.currentFloor);
    game.spawnTimer = 0;
    game.message = `Piso ${profile.currentFloor}`;
    game.messageTimer = 1.2;
    updateBanner("Arena lista");
    updateHud();
  }

  function startRun() {
    if (!isAuthenticated()) {
      showToast("Primero conecta y autentica tu wallet.", "error");
      setScreen("login");
      return;
    }

    closeAllModals();
    resetRun();
    setScreen("game");
    game.running = true;
    game.lastTs = 0;
    updateBanner(`Piso ${profile.currentFloor} · Sala 1/7`);
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

    const elite = Math.random() > 0.82;

    game.enemies.push({
      x,
      y,
      r: elite ? 18 : 14,
      hp: elite ? 5 + profile.currentFloor : 3 + profile.currentFloor * 0.3,
      maxHp: elite ? 5 + profile.currentFloor : 3 + profile.currentFloor * 0.3,
      speed: elite ? 64 : 78 + profile.currentFloor * 3,
      damage: elite ? 12 : 8,
      elite,
    });
  }

  function spawnBoss() {
    if (game.boss) return;

    game.boss = {
      x: canvas.width * 0.5,
      y: 92,
      r: 30,
      hp: 90 + profile.currentFloor * 30,
      maxHp: 90 + profile.currentFloor * 30,
      speed: 54 + profile.currentFloor * 2,
      damage: 18,
    };

    game.message = "BOSS INVOCADO";
    game.messageTimer = 1.8;
    updateBanner("Boss activo");
  }

  function shootAt(targetX, targetY) {
    if (!game.player || game.player.fireCooldown > 0) return;

    const angle = Math.atan2(targetY - game.player.y, targetX - game.player.x);
    const count = getProjectileCount();
    const spread = count === 1 ? 0 : 0.18;
    const startOffset = -((count - 1) * spread) / 2;
    const bonusDamage = profile.ownedItems.focusLens ? 1 : 0;

    for (let i = 0; i < count; i++) {
      const a = angle + startOffset + spread * i;
      const speed = profile.ownedItems.focusLens ? 590 : 520;

      let bulletDamage = game.player.damage + bonusDamage;
      if (profile.ownedItems.focusLens && Math.random() < 0.16) {
        bulletDamage *= 1.8;
      }

      game.bullets.push({
        x: game.player.x,
        y: game.player.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: 4,
        damage: bulletDamage,
        ttl: 1.2,
      });
    }

    game.player.fireCooldown = game.player.fireRate;
  }

  function healOnKill(amount) {
    if (!game.player) return;
    game.player.hp = Math.min(game.player.maxHp, game.player.hp + amount);
  }

  function update(dt) {
    if (!game.player) return;

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
    }

    game.player.x = clamp(game.player.x, 28, canvas.width - 28);
    game.player.y = clamp(game.player.y, 92, canvas.height - 46);

    if (game.mouse.down) {
      shootAt(game.mouse.x, game.mouse.y);
    }

    if (!game.boss && game.kills < game.targetKills) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) {
        spawnEnemy();
        game.spawnTimer = Math.max(0.28, 0.75 - profile.currentFloor * 0.03);
      }
    }

    if (!game.boss && game.kills >= game.targetKills) {
      spawnBoss();
    }

    for (let i = game.bullets.length - 1; i >= 0; i--) {
      const b = game.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.ttl -= dt;

      if (b.ttl <= 0 || b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) {
        game.bullets.splice(i, 1);
      }
    }

    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const e = game.enemies[i];
      const dx = game.player.x - e.x;
      const dy = game.player.y - e.y;
      const len = Math.hypot(dx, dy) || 1;

      e.x += (dx / len) * e.speed * dt;
      e.y += (dy / len) * e.speed * dt;

      for (let j = game.bullets.length - 1; j >= 0; j--) {
        const b = game.bullets[j];
        if (dist(e.x, e.y, b.x, b.y) <= e.r + b.r) {
          e.hp -= b.damage;
          game.bullets.splice(j, 1);

          if (e.hp <= 0) {
            game.enemies.splice(i, 1);
            game.kills += 1;
            game.totalKillsRun += 1;

            if (profile.ownedItems.bloodCore) {
              healOnKill(2);
            }

            updateBanner(`${Math.max(0, game.targetKills - game.kills)} enemigos restantes`);
            updateHud();
          }
          break;
        }
      }

      if (!game.enemies[i]) continue;

      if (dist(e.x, e.y, game.player.x, game.player.y) <= e.r + game.player.r) {
        if (game.player.invuln <= 0) {
          const mitigation = profile.ownedItems.nightVeil ? 0.75 : 1;
          game.player.hp -= e.damage * mitigation;
          game.player.invuln = 0.55;
          updateHud();
          if (game.player.hp <= 0) {
            onDefeat();
            return;
          }
        }
      }
    }

    if (game.boss) {
      const b = game.boss;
      const dx = game.player.x - b.x;
      const dy = game.player.y - b.y;
      const len = Math.hypot(dx, dy) || 1;

      b.x += (dx / len) * b.speed * dt;
      b.y += (dy / len) * b.speed * dt;

      for (let j = game.bullets.length - 1; j >= 0; j--) {
        const bullet = game.bullets[j];
        if (dist(b.x, b.y, bullet.x, bullet.y) <= b.r + bullet.r) {
          b.hp -= bullet.damage;
          game.bullets.splice(j, 1);
          if (b.hp <= 0) {
            onBossDefeated();
            return;
          }
        }
      }

      if (dist(b.x, b.y, game.player.x, game.player.y) <= b.r + game.player.r) {
        if (game.player.invuln <= 0) {
          const mitigation = profile.ownedItems.nightVeil ? 0.78 : 1;
          game.player.hp -= b.damage * mitigation;
          game.player.invuln = 0.8;
          updateHud();
          if (game.player.hp <= 0) {
            onDefeat();
            return;
          }
        }
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

    renderHearts();
    renderDashMeter();
  }

  function setSkinUi({ card, state, button, skinName, priceText }) {
    if (!card || !state || !button) return;

    const owned = !!profile.ownedSkins[skinName];
    const equipped = profile.equippedSkin === skinName;

    card.classList.remove("shop-card--equipped", "shop-card--owned");
    button.classList.remove("shop-btn--equipped", "shop-btn--owned");

    if (equipped) {
      card.classList.add("shop-card--equipped");
      state.textContent = "Equipado";
      state.className = "shop-owned-badge shop-owned-badge--equipped";
      button.textContent = "Equipado";
      button.disabled = true;
      button.classList.add("shop-btn--equipped");
      return;
    }

    if (owned) {
      card.classList.add("shop-card--owned");
      state.textContent = "Comprado";
      state.className = "shop-owned-badge shop-owned-badge--owned";
      button.textContent = "Equipar";
      button.disabled = false;
      button.classList.add("shop-btn--owned");
      return;
    }

    state.textContent = "No comprado";
    state.className = "shop-owned-badge";
    button.textContent = `Comprar`;
    button.disabled = false;
    button.title = priceText || "";
  }

  function setOneTimeItemButton(button, owned) {
    if (!button) return;

    button.classList.remove("shop-btn--owned", "shop-btn--equipped");
    if (owned) {
      button.textContent = "Comprado";
      button.disabled = true;
      button.classList.add("shop-btn--owned");
    } else {
      button.textContent = "Comprar";
      button.disabled = false;
    }
  }

  function updateStoreUi() {
    setSkinUi({
      card: refs.skinLambCard,
      state: refs.skinLambState,
      button: refs.buySkinLambBtn,
      skinName: "Cordero",
      priceText: "Gratis",
    });

    setSkinUi({
      card: refs.skinVoidCard,
      state: refs.skinVoidState,
      button: refs.buySkinVoidBtn,
      skinName: "Sectorio",
      priceText: "0.0040 SOL",
    });

    setSkinUi({
      card: refs.skinSolarCard,
      state: refs.skinSolarState,
      button: refs.buySkinSolarBtn,
      skinName: "Hereje",
      priceText: "0.0050 SOL",
    });

    setSkinUi({
      card: refs.skinBloodCard,
      state: refs.skinBloodState,
      button: refs.buySkinBloodBtn,
      skinName: "Dios de Sangre",
      priceText: "0.0070 SOL",
    });

    setOneTimeItemButton(refs.buySplitShotBtn, profile.ownedItems.splitShot);
    setOneTimeItemButton(refs.buyFocusLensBtn, profile.ownedItems.focusLens);
    setOneTimeItemButton(refs.buyBloodCoreBtn, profile.ownedItems.bloodCore);
    setOneTimeItemButton(refs.buyNightVeilBtn, profile.ownedItems.nightVeil);

    if (refs.ownedSkinsCountLabel) {
      refs.ownedSkinsCountLabel.textContent = `${countOwnedSkins()} / 4`;
    }

    if (refs.equippedSkinStoreLabel) {
      refs.equippedSkinStoreLabel.textContent = profile.equippedSkin;
    }
  }

  function updateMetaUI() {
    const sol = Number(profile.sol).toFixed(4);
    if (refs.coinsLabel) refs.coinsLabel.textContent = sol;
    if (refs.coinsLabelTop) refs.coinsLabelTop.textContent = sol;
    if (refs.storeSolLabel) refs.storeSolLabel.textContent = sol;
    if (refs.rewardStatus) {
      refs.rewardStatus.textContent = pendingReward
        ? `${Number(pendingReward.rewardAmountSol || 0).toFixed(4)} SOL pendiente`
        : "No disponible";
    }
    if (refs.equippedSkinLabel) refs.equippedSkinLabel.textContent = profile.equippedSkin;
    if (refs.damageLabel) refs.damageLabel.textContent = String(profile.damage);
    if (refs.speedLabel) refs.speedLabel.textContent = String(profile.speed);

    if (refs.claimRewardBtn) {
      refs.claimRewardBtn.disabled = !isAuthenticated() || !pendingReward;
    }

    updateStoreUi();
    saveProfile();
  }

  function spendSol(amount) {
    if (profile.sol < amount) {
      showToast("No tienes suficiente SOL.", "error");
      return false;
    }
    profile.sol = Number((profile.sol - amount).toFixed(4));
    saveProfile();
    updateMetaUI();
    return true;
  }

  function equipSkin(skinName) {
    if (!profile.ownedSkins[skinName]) return;
    profile.equippedSkin = skinName;
    saveProfile();
    updateMetaUI();
    showToast(`${skinName} equipado.`, "success");
  }

  function handleSkinPurchaseOrEquip(skinName, cost) {
    if (!profile.ownedSkins[skinName]) {
      if (!spendSol(cost)) return;
      profile.ownedSkins[skinName] = true;
      profile.equippedSkin = skinName;
      saveProfile();
      updateMetaUI();
      showToast(`${skinName} comprado y equipado.`, "success");
      return;
    }

    if (profile.equippedSkin !== skinName) {
      equipSkin(skinName);
    }
  }

  function purchaseOneTimeItem(key, cost, label) {
    if (profile.ownedItems[key]) {
      showToast(`${label} ya fue comprado.`, "error");
      return;
    }
    if (!spendSol(cost)) return;
    profile.ownedItems[key] = true;
    saveProfile();
    updateMetaUI();
    showToast(`${label} comprado.`, "success");
  }

  function buyDamage() {
    if (!spendSol(0.003)) return;
    profile.damage += 1;
    profile.ownedItems.damageBoost += 1;
    saveProfile();
    updateMetaUI();
    showToast("Damage Boost comprado.", "success");
  }

  function buySpeed() {
    if (!spendSol(0.0025)) return;
    profile.speed += 1;
    profile.ownedItems.speedBoost += 1;
    saveProfile();
    updateMetaUI();
    showToast("Speed Boost comprado.", "success");
  }

  function claimDailyReward() {
    const today = todayKey();
    if (profile.dailyClaimDay === today) {
      showToast("La ofrenda diaria ya fue reclamada hoy.", "error");
      return;
    }

    const amount = 0.0015;
    profile.dailyClaimDay = today;
    profile.sol = Number((profile.sol + amount).toFixed(4));
    saveProfile();
    updateMetaUI();
    updateBanner(`Ofrenda +${amount.toFixed(4)} SOL`);
    showToast(`Ofrenda diaria: +${amount.toFixed(4)} SOL`, "success");
  }

  function spinOracle() {
    const today = todayKey();
    if (profile.oracleSpinDay === today) {
      showToast("El oráculo ya fue consultado hoy.", "error");
      return;
    }

    profile.oracleSpinDay = today;
    saveProfile();

    if (refs.spinOracleBtn) refs.spinOracleBtn.disabled = true;
    if (refs.oracleWheel) refs.oracleWheel.classList.add("spinning");
    if (refs.oracleMessage) refs.oracleMessage.textContent = "El oráculo responde...";

    setTimeout(() => {
      const roll = Math.random();

      if (roll < 0.34) {
        const amount = 0.002;
        profile.sol = Number((profile.sol + amount).toFixed(4));
        refs.oracleMessage.textContent = `Has ganado ${amount.toFixed(4)} SOL`;
        updateBanner(`Oráculo: +${amount.toFixed(4)} SOL`);
      } else if (roll < 0.67) {
        profile.damage += 1;
        refs.oracleMessage.textContent = "Bendición de daño +1";
        updateBanner("Oráculo: daño +1");
      } else {
        profile.speed += 1;
        refs.oracleMessage.textContent = "Bendición de velocidad +1";
        updateBanner("Oráculo: velocidad +1");
      }

      saveProfile();
      updateMetaUI();

      if (refs.oracleWheel) refs.oracleWheel.classList.remove("spinning");
      if (refs.spinOracleBtn) refs.spinOracleBtn.disabled = false;
      showToast(refs.oracleMessage.textContent, "success");
    }, 1800);
  }

  async function registerRunComplete() {
    if (!isAuthenticated()) return;

    try {
      const response = await fetch("/run/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
          savePendingReward(data.pendingRun);
          updateMetaUI();
        }
        throw new Error(data.message || "No se pudo registrar la run");
      }

      savePendingReward(data.run);
      updateMetaUI();
      showToast(`Run completada. Reward pendiente: ${Number(data.run.rewardAmountSol).toFixed(4)} SOL`, "success");
    } catch (error) {
      showToast(error.message || "Error registrando la run.", "error");
    }
  }

  async function claimPendingReward() {
    if (!pendingReward) {
      showToast("No hay reward pendiente.", "error");
      return;
    }

    if (!isAuthenticated()) {
      showToast("No hay sesión activa.", "error");
      return;
    }

    try {
      const response = await fetch("/reward/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionToken: getSessionToken() }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "No se pudo reclamar la reward");
      }

      profile.sol = Number((profile.sol + Number(data.rewardAmountSol || 0)).toFixed(4));
      saveProfile();
      savePendingReward(null);
      updateMetaUI();
      updateBanner(`Reward +${Number(data.rewardAmountSol).toFixed(4)} SOL`);
      showToast(`Reward enviada: +${Number(data.rewardAmountSol).toFixed(4)} SOL`, "success");
    } catch (error) {
      showToast(error.message || "Error reclamando reward.", "error");
    }
  }

  function onBossDefeated() {
    game.running = false;
    profile.currentFloor += 1;
    saveProfile();
    updateMetaUI();
    updateBanner("Piso completado");
    showToast(`Piso ${profile.currentFloor - 1} completado.`, "success");
    registerRunComplete();
    setScreen("menu");
  }

  function onDefeat() {
    game.running = false;
    updateBanner("Run terminada");
    showToast("Has caído en la arena.", "error");
    setScreen("menu");
  }

  function drawBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tile = 48;
    for (let y = 0; y < canvas.height; y += tile) {
      for (let x = 0; x < canvas.width; x += tile) {
        const even = ((x / tile) + (y / tile)) % 2 === 0;
        ctx.fillStyle = even ? "#170109" : "#0e0106";
        ctx.fillRect(x, y, tile, tile);
      }
    }

    ctx.fillStyle = "#4a1426";
    ctx.fillRect(0, 0, canvas.width, 54);
    ctx.fillRect(0, canvas.height - 44, canvas.width, 44);
    ctx.fillRect(0, 0, 50, canvas.height);
    ctx.fillRect(canvas.width - 50, 0, 50, canvas.height);

    const lights = [
      [66, 72], [canvas.width - 66, 72],
      [66, canvas.height - 72], [canvas.width - 66, canvas.height - 72],
    ];

    lights.forEach(([lx, ly]) => {
      const glow = ctx.createRadialGradient(lx, ly, 4, lx, ly, 40);
      glow.addColorStop(0, "rgba(255,190,64,0.9)");
      glow.addColorStop(0.45, "rgba(255,132,15,0.25)");
      glow.addColorStop(1, "rgba(255,132,15,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, ly, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffae38";
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fill();
    });
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
        ctx.fillRect(
          Math.round(x + col * scale),
          Math.round(y + row * scale),
          scale,
          scale
        );
      }
    }
  }

  function drawPlayer() {
    if (!game.player) return;
    const palette = getPlayerPalette();
    const size = 5;
    const pxWidth = 8 * size;
    const pxHeight = 8 * size;

    if (game.player.invuln > 0) {
      ctx.globalAlpha = 0.65;
    }

    drawPixelBody(game.player.x - pxWidth / 2, game.player.y - pxHeight / 2, size, palette);
    ctx.globalAlpha = 1;
  }

  function drawBullets() {
    for (const bullet of game.bullets) {
      ctx.fillStyle = "#d5f2ff";
      ctx.fillRect(bullet.x - 2, bullet.y - 2, 5, 5);
    }
  }

  function drawEnemy(enemy) {
    const size = enemy.elite ? 6 : 5;
    const baseX = enemy.x - 4 * size;
    const baseY = enemy.y - 4 * size;
    const c1 = enemy.elite ? "#ff8f2c" : "#d23922";
    const c2 = enemy.elite ? "#ffd47a" : "#ffb028";

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

    for (let row = 0; row < px.length; row++) {
      for (let col = 0; col < px[row].length; col++) {
        if (px[row][col] === "0") continue;
        ctx.fillStyle = row < 2 ? c2 : c1;
        ctx.fillRect(baseX + col * size, baseY + row * size, size, size);
      }
    }
  }

  function drawEnemies() {
    for (const enemy of game.enemies) {
      drawEnemy(enemy);
    }
  }

  function drawBoss() {
    if (!game.boss) return;

    const b = game.boss;
    ctx.fillStyle = "rgba(255, 45, 45, 0.18)";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d11414";
    ctx.fillRect(b.x - 26, b.y - 26, 52, 52);
    ctx.fillStyle = "#ffb223";
    ctx.fillRect(b.x - 18, b.y - 14, 8, 8);
    ctx.fillRect(b.x + 10, b.y - 14, 8, 8);

    const w = 220;
    const ratio = clamp(b.hp / b.maxHp, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(canvas.width / 2 - w / 2, 68, w, 10);
    ctx.fillStyle = "#ff4251";
    ctx.fillRect(canvas.width / 2 - w / 2, 68, w * ratio, 10);
  }

  function drawMessage() {
    if (game.messageTimer <= 0 || !game.message) return;
    ctx.save();
    ctx.textAlign = "center";
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

    drawBackground();

    if (!game.player) return;

    drawBullets();
    drawEnemies();
    drawBoss();
    drawPlayer();
    drawMessage();
  }

  function setStoreTab(tab) {
    [refs.tabCharacters, refs.tabWeapons, refs.tabRelics].forEach((panel) => panel.classList.remove("active"));
    [refs.tabCharactersBtn, refs.tabWeaponsBtn, refs.tabRelicsBtn].forEach((btn) => btn.classList.remove("active"));

    if (tab === "characters") {
      refs.tabCharacters.classList.add("active");
      refs.tabCharactersBtn.classList.add("active");
    }
    if (tab === "weapons") {
      refs.tabWeapons.classList.add("active");
      refs.tabWeaponsBtn.classList.add("active");
    }
    if (tab === "relics") {
      refs.tabRelics.classList.add("active");
      refs.tabRelicsBtn.classList.add("active");
    }
  }

  function bindEvents() {
    window.addEventListener("resize", resizeCanvas);

    window.addEventListener(
      "keydown",
      (event) => {
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
          if (activeModal) {
            closeModal(activeModal);
          } else if (screens.game.classList.contains("active")) {
            game.running = false;
            setScreen("menu");
          }
        }
      },
      { passive: false }
    );

    window.addEventListener("keyup", (event) => {
      keys[event.key.toLowerCase()] = false;
    });

    if (canvas) {
      canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        game.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
        game.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
      });

      canvas.addEventListener("mousedown", (event) => {
        if (event.button !== 0) return;
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
    refs.backToMenuFromGameBtn?.addEventListener("click", () => {
      game.running = false;
      closeAllModals();
      setScreen("menu");
    });

    refs.closeStoreModalBtn?.addEventListener("click", () => closeModal("store"));
    refs.closeOracleModalBtn?.addEventListener("click", () => closeModal("oracle"));

    document.querySelectorAll("[data-close-modal='store']").forEach((el) => {
      el.addEventListener("click", () => closeModal("store"));
    });

    document.querySelectorAll("[data-close-modal='oracle']").forEach((el) => {
      el.addEventListener("click", () => closeModal("oracle"));
    });

    refs.menuDisconnectBtn?.addEventListener("click", () => {
      refs.disconnectWalletBtn?.click();
      closeAllModals();
      setScreen("login");
    });

    refs.claimRewardBtn?.addEventListener("click", claimPendingReward);

    refs.buySkinLambBtn?.addEventListener("click", () => handleSkinPurchaseOrEquip("Cordero", 0));
    refs.buySkinVoidBtn?.addEventListener("click", () => handleSkinPurchaseOrEquip("Sectorio", 0.004));
    refs.buySkinSolarBtn?.addEventListener("click", () => handleSkinPurchaseOrEquip("Hereje", 0.005));
    refs.buySkinBloodBtn?.addEventListener("click", () => handleSkinPurchaseOrEquip("Dios de Sangre", 0.007));

    refs.buyDamageBtn?.addEventListener("click", buyDamage);
    refs.buySpeedBtn?.addEventListener("click", buySpeed);
    refs.buySplitShotBtn?.addEventListener("click", () => purchaseOneTimeItem("splitShot", 0.006, "Split Shot"));
    refs.buyFocusLensBtn?.addEventListener("click", () => purchaseOneTimeItem("focusLens", 0.008, "Focus Lens"));
    refs.buyBloodCoreBtn?.addEventListener("click", () => purchaseOneTimeItem("bloodCore", 0.0065, "Blood Core"));
    refs.buyNightVeilBtn?.addEventListener("click", () => purchaseOneTimeItem("nightVeil", 0.0045, "Night Veil"));

    refs.dailyRewardBtn?.addEventListener("click", claimDailyReward);
    refs.spinOracleBtn?.addEventListener("click", spinOracle);

    refs.tabCharactersBtn?.addEventListener("click", () => setStoreTab("characters"));
    refs.tabWeaponsBtn?.addEventListener("click", () => setStoreTab("weapons"));
    refs.tabRelicsBtn?.addEventListener("click", () => setStoreTab("relics"));

    observeNode(refs.walletStatus, syncAuthMirror);
    observeNode(refs.walletAddress, syncAuthMirror);
    observeNode(refs.authStatus, syncScreenFromSession);

    setInterval(syncScreenFromSession, 500);
  }

  function loop(ts) {
    requestAnimationFrame(loop);

    resizeCanvas();

    if (!canvas || !ctx) return;

    if (!screens.game.classList.contains("active")) {
      drawIdle();
      game.lastTs = ts;
      return;
    }

    if (!game.lastTs) game.lastTs = ts;
    const dt = Math.min(0.032, (ts - game.lastTs) / 1000);
    game.lastTs = ts;

    if (game.running && !activeModal) {
      update(dt);
    }

    render();
  }

  function bootstrap() {
    resizeCanvas();
    bindEvents();
    resetRun();
    updateMetaUI();
    syncScreenFromSession();
    setStoreTab("characters");
    drawIdle();
    requestAnimationFrame(loop);
  }

  bootstrap();
})();