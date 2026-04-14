(function () {
  const STORAGE_KEY = "sol_runner_profile_v6";
  const PENDING_REWARD_KEY = "sol_runner_pending_reward_v6";

  const SKIN_CATALOG = [
    { key: "Cordero", price: 0, rarity: "common", ownedByDefault: true },
    { key: "Sectorio", price: 0.004, rarity: "rare" },
    { key: "Hereje", price: 0.005, rarity: "epic" },
    { key: "Dios de Sangre", price: 0.007, rarity: "legendary" },

    { key: "Peregrino de Ceniza", price: 0.0045, rarity: "rare" },
    { key: "Monja del Vacío", price: 0.0055, rarity: "epic" },
    { key: "Rey Caído", price: 0.0075, rarity: "legendary" },
    { key: "Arcángel Roto", price: 0.009, rarity: "mythic" },
  ];

  const ITEM_CATALOG = {
    damageBoost: { type: "stack", price: 0.003 },
    speedBoost: { type: "stack", price: 0.0025 },

    splitShot: { type: "one-time", price: 0.006 },
    focusLens: { type: "one-time", price: 0.008 },
    bloodCore: { type: "one-time", price: 0.0065 },
    nightVeil: { type: "one-time", price: 0.0045 },

    chainBurst: { type: "one-time", price: 0.0075 },
    emberHeart: { type: "one-time", price: 0.0068 },
    soulMagnet: { type: "one-time", price: 0.0058 },
    glassCannon: { type: "one-time", price: 0.0085 },

    armorBoost: { type: "stack", price: 0.0035 },
    critBoost: { type: "stack", price: 0.0042 },
  };

  function buildDefaultOwnedSkins() {
    return SKIN_CATALOG.reduce((acc, skin) => {
      acc[skin.key] = !!skin.ownedByDefault;
      return acc;
    }, {});
  }

  function buildDefaultOwnedItems() {
    return Object.keys(ITEM_CATALOG).reduce((acc, key) => {
      acc[key] = ITEM_CATALOG[key].type === "stack" ? 0 : false;
      return acc;
    }, {});
  }

  const DEFAULT_PROFILE = {
    sol: 0.01,
    damage: 1,
    speed: 4,
    armor: 0,
    critChance: 0,
    luck: 0,
    equippedSkin: "Cordero",
    currentFloor: 1,
    dailyClaimDay: "",
    oracleSpinDay: "",
    ownedSkins: buildDefaultOwnedSkins(),
    ownedItems: buildDefaultOwnedItems(),
  };

  function cloneProfile(data) {
    return {
      ...data,
      ownedSkins: { ...(data.ownedSkins || {}) },
      ownedItems: { ...(data.ownedItems || {}) },
    };
  }

  function normalizeProfile(raw) {
    const merged = cloneProfile({
      ...DEFAULT_PROFILE,
      ...(raw || {}),
      ownedSkins: {
        ...DEFAULT_PROFILE.ownedSkins,
        ...(raw?.ownedSkins || {}),
      },
      ownedItems: {
        ...DEFAULT_PROFILE.ownedItems,
        ...(raw?.ownedItems || {}),
      },
    });

    if (!merged.equippedSkin || !merged.ownedSkins[merged.equippedSkin]) {
      merged.equippedSkin = "Cordero";
      merged.ownedSkins.Cordero = true;
    }

    return merged;
  }

  function loadProfile() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return normalizeProfile(raw);
    } catch {
      return normalizeProfile(null);
    }
  }

  function saveProfile(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
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
    if (data) {
      localStorage.setItem(PENDING_REWARD_KEY, JSON.stringify(data));
      return data;
    }

    localStorage.removeItem(PENDING_REWARD_KEY);
    return null;
  }

  function getSkinCatalog() {
    return [...SKIN_CATALOG];
  }

  function getItemCatalog() {
    return { ...ITEM_CATALOG };
  }

  function getSkinByName(skinName) {
    return SKIN_CATALOG.find((skin) => skin.key === skinName) || null;
  }

  function countOwnedSkins(profile) {
    return Object.values(profile?.ownedSkins || {}).filter(Boolean).length;
  }

  function getTotalSkins() {
    return SKIN_CATALOG.length;
  }

  function todayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function spendSol(profile, amount) {
    const safeAmount = Number(amount || 0);

    if (Number(profile.sol || 0) < safeAmount) {
      return { ok: false, profile };
    }

    profile.sol = Number((Number(profile.sol || 0) - safeAmount).toFixed(4));
    saveProfile(profile);

    return { ok: true, profile };
  }

  function addSol(profile, amount) {
    profile.sol = Number((Number(profile.sol || 0) + Number(amount || 0)).toFixed(4));
    saveProfile(profile);
    return profile;
  }

  function equipSkin(profile, skinName) {
    if (!profile?.ownedSkins?.[skinName]) {
      return profile;
    }

    profile.equippedSkin = skinName;
    saveProfile(profile);
    return profile;
  }

  function buySkin(profile, skinName, cost) {
    if (!profile?.ownedSkins) {
      return { ok: false, reason: "INVALID_PROFILE", profile };
    }

    if (!profile.ownedSkins[skinName]) {
      const result = spendSol(profile, cost);
      if (!result.ok) {
        return { ok: false, reason: "INSUFFICIENT_SOL", profile };
      }

      profile.ownedSkins[skinName] = true;
    }

    profile.equippedSkin = skinName;
    saveProfile(profile);

    return { ok: true, profile };
  }

  function buyOneTimeItem(profile, key, cost) {
    if (!profile?.ownedItems || !(key in profile.ownedItems)) {
      return { ok: false, reason: "INVALID_ITEM", profile };
    }

    if (profile.ownedItems[key]) {
      return { ok: false, reason: "ALREADY_OWNED", profile };
    }

    const result = spendSol(profile, cost);
    if (!result.ok) {
      return { ok: false, reason: "INSUFFICIENT_SOL", profile };
    }

    profile.ownedItems[key] = true;
    saveProfile(profile);

    return { ok: true, profile };
  }

  function buyStackItem(profile, key, cost, statField, amount = 1) {
    if (!profile?.ownedItems || !(key in profile.ownedItems)) {
      return { ok: false, reason: "INVALID_ITEM", profile };
    }

    const result = spendSol(profile, cost);
    if (!result.ok) {
      return { ok: false, reason: "INSUFFICIENT_SOL", profile };
    }

    profile.ownedItems[key] = Number(profile.ownedItems[key] || 0) + 1;
    profile[statField] = Number(profile[statField] || 0) + Number(amount || 0);

    saveProfile(profile);
    return { ok: true, profile };
  }

  function buyDamageBoost(profile) {
    return buyStackItem(profile, "damageBoost", ITEM_CATALOG.damageBoost.price, "damage", 1);
  }

  function buySpeedBoost(profile) {
    return buyStackItem(profile, "speedBoost", ITEM_CATALOG.speedBoost.price, "speed", 1);
  }

  function buyArmorBoost(profile) {
    return buyStackItem(profile, "armorBoost", ITEM_CATALOG.armorBoost.price, "armor", 1);
  }

  function buyCritBoost(profile) {
    return buyStackItem(profile, "critBoost", ITEM_CATALOG.critBoost.price, "critChance", 1);
  }

  function applyDailyReward(profile, amount = 0.0015) {
    const today = todayKey();

    if (profile.dailyClaimDay === today) {
      return { ok: false, reason: "ALREADY_CLAIMED", profile };
    }

    profile.dailyClaimDay = today;
    addSol(profile, amount);

    return { ok: true, amount, profile };
  }

  function markOracleSpin(profile) {
    const today = todayKey();

    if (profile.oracleSpinDay === today) {
      return { ok: false, reason: "ALREADY_SPUN", profile };
    }

    profile.oracleSpinDay = today;
    saveProfile(profile);

    return { ok: true, profile };
  }

  function applyOracleReward(profile, reward) {
    if (!reward?.type) {
      return profile;
    }

    if (reward.type === "sol") {
      addSol(profile, Number(reward.amount || 0));
      return profile;
    }

    if (reward.type === "damage") {
      profile.damage += Number(reward.amount || 1);
      saveProfile(profile);
      return profile;
    }

    if (reward.type === "speed") {
      profile.speed += Number(reward.amount || 1);
      saveProfile(profile);
      return profile;
    }

    if (reward.type === "armor") {
      profile.armor += Number(reward.amount || 1);
      saveProfile(profile);
      return profile;
    }

    if (reward.type === "crit") {
      profile.critChance += Number(reward.amount || 1);
      saveProfile(profile);
      return profile;
    }

    if (reward.type === "skin" && reward.skinName) {
      profile.ownedSkins[reward.skinName] = true;
      profile.equippedSkin = reward.skinName;
      saveProfile(profile);
      return profile;
    }

    if (reward.type === "item" && reward.itemKey && reward.itemKey in profile.ownedItems) {
      if (typeof profile.ownedItems[reward.itemKey] === "boolean") {
        profile.ownedItems[reward.itemKey] = true;
      } else {
        profile.ownedItems[reward.itemKey] =
          Number(profile.ownedItems[reward.itemKey] || 0) + Number(reward.amount || 1);
      }

      saveProfile(profile);
      return profile;
    }

    return profile;
  }

  function resetProfile() {
    const profile = normalizeProfile(null);
    saveProfile(profile);
    savePendingReward(null);
    return profile;
  }

  window.solRunnerProfileService = {
    STORAGE_KEY,
    PENDING_REWARD_KEY,
    DEFAULT_PROFILE,

    getSkinCatalog,
    getItemCatalog,
    getSkinByName,
    getTotalSkins,

    loadProfile,
    saveProfile,
    loadPendingReward,
    savePendingReward,

    countOwnedSkins,
    todayKey,
    spendSol,
    addSol,
    equipSkin,
    buySkin,
    buyOneTimeItem,
    buyStackItem,
    buyDamageBoost,
    buySpeedBoost,
    buyArmorBoost,
    buyCritBoost,
    applyDailyReward,
    markOracleSpin,
    applyOracleReward,
    resetProfile,
  };
})();