(function () {
  const refs = {
    coinsLabel: () => document.getElementById("coinsLabel"),
    coinsLabelTop: () => document.getElementById("coinsLabelTop"),
    storeSolLabel: () => document.getElementById("storeSolLabel"),
    rewardStatus: () => document.getElementById("rewardStatus"),
    equippedSkinLabel: () => document.getElementById("equippedSkinLabel"),
    damageLabel: () => document.getElementById("damageLabel"),
    speedLabel: () => document.getElementById("speedLabel"),
    armorLabel: () => document.getElementById("armorLabel"),
    critLabel: () => document.getElementById("critLabel"),
    claimRewardBtn: () => document.getElementById("claimRewardBtn"),

    ownedSkinsCountLabel: () => document.getElementById("ownedSkinsCountLabel"),
    equippedSkinStoreLabel: () => document.getElementById("equippedSkinStoreLabel"),

    tabCharactersBtn: () => document.getElementById("tabCharactersBtn"),
    tabWeaponsBtn: () => document.getElementById("tabWeaponsBtn"),
    tabRelicsBtn: () => document.getElementById("tabRelicsBtn"),

    tabCharacters: () => document.getElementById("tabCharacters"),
    tabWeapons: () => document.getElementById("tabWeapons"),
    tabRelics: () => document.getElementById("tabRelics"),

    skinLambCard: () => document.getElementById("skinLambCard"),
    skinVoidCard: () => document.getElementById("skinVoidCard"),
    skinSolarCard: () => document.getElementById("skinSolarCard"),
    skinBloodCard: () => document.getElementById("skinBloodCard"),
    skinAshCard: () => document.getElementById("skinAshCard"),
    skinNunCard: () => document.getElementById("skinNunCard"),
    skinFallenKingCard: () => document.getElementById("skinFallenKingCard"),
    skinBrokenAngelCard: () => document.getElementById("skinBrokenAngelCard"),

    skinLambState: () => document.getElementById("skinLambState"),
    skinVoidState: () => document.getElementById("skinVoidState"),
    skinSolarState: () => document.getElementById("skinSolarState"),
    skinBloodState: () => document.getElementById("skinBloodState"),
    skinAshState: () => document.getElementById("skinAshState"),
    skinNunState: () => document.getElementById("skinNunState"),
    skinFallenKingState: () => document.getElementById("skinFallenKingState"),
    skinBrokenAngelState: () => document.getElementById("skinBrokenAngelState"),

    buySkinLambBtn: () => document.getElementById("buySkinLambBtn"),
    buySkinVoidBtn: () => document.getElementById("buySkinVoidBtn"),
    buySkinSolarBtn: () => document.getElementById("buySkinSolarBtn"),
    buySkinBloodBtn: () => document.getElementById("buySkinBloodBtn"),
    buySkinAshBtn: () => document.getElementById("buySkinAshBtn"),
    buySkinNunBtn: () => document.getElementById("buySkinNunBtn"),
    buySkinFallenKingBtn: () => document.getElementById("buySkinFallenKingBtn"),
    buySkinBrokenAngelBtn: () => document.getElementById("buySkinBrokenAngelBtn"),

    buyDamageBtn: () => document.getElementById("buyDamageBtn"),
    buySpeedBtn: () => document.getElementById("buySpeedBtn"),
    buySplitShotBtn: () => document.getElementById("buySplitShotBtn"),
    buyFocusLensBtn: () => document.getElementById("buyFocusLensBtn"),
    buyBloodCoreBtn: () => document.getElementById("buyBloodCoreBtn"),
    buyNightVeilBtn: () => document.getElementById("buyNightVeilBtn"),

    buyArmorBoostBtn: () => document.getElementById("buyArmorBoostBtn"),
    buyCritBoostBtn: () => document.getElementById("buyCritBoostBtn"),
    buyChainBurstBtn: () => document.getElementById("buyChainBurstBtn"),
    buyEmberHeartBtn: () => document.getElementById("buyEmberHeartBtn"),
    buySoulMagnetBtn: () => document.getElementById("buySoulMagnetBtn"),
    buyGlassCannonBtn: () => document.getElementById("buyGlassCannonBtn"),
  };

  const SKIN_BINDINGS = [
    { key: "Cordero", card: () => refs.skinLambCard(), state: () => refs.skinLambState(), button: () => refs.buySkinLambBtn() },
    { key: "Sectorio", card: () => refs.skinVoidCard(), state: () => refs.skinVoidState(), button: () => refs.buySkinVoidBtn() },
    { key: "Hereje", card: () => refs.skinSolarCard(), state: () => refs.skinSolarState(), button: () => refs.buySkinSolarBtn() },
    { key: "Dios de Sangre", card: () => refs.skinBloodCard(), state: () => refs.skinBloodState(), button: () => refs.buySkinBloodBtn() },
    { key: "Peregrino de Ceniza", card: () => refs.skinAshCard(), state: () => refs.skinAshState(), button: () => refs.buySkinAshBtn() },
    { key: "Monja del Vacío", card: () => refs.skinNunCard(), state: () => refs.skinNunState(), button: () => refs.buySkinNunBtn() },
    { key: "Rey Caído", card: () => refs.skinFallenKingCard(), state: () => refs.skinFallenKingState(), button: () => refs.buySkinFallenKingBtn() },
    { key: "Arcángel Roto", card: () => refs.skinBrokenAngelCard(), state: () => refs.skinBrokenAngelState(), button: () => refs.buySkinBrokenAngelBtn() },
  ];

  const ONE_TIME_ITEM_BINDINGS = [
    { key: "splitShot", label: "Split Shot", button: () => refs.buySplitShotBtn() },
    { key: "focusLens", label: "Focus Lens", button: () => refs.buyFocusLensBtn() },
    { key: "bloodCore", label: "Blood Core", button: () => refs.buyBloodCoreBtn() },
    { key: "nightVeil", label: "Night Veil", button: () => refs.buyNightVeilBtn() },
    { key: "chainBurst", label: "Chain Burst", button: () => refs.buyChainBurstBtn() },
    { key: "emberHeart", label: "Ember Heart", button: () => refs.buyEmberHeartBtn() },
    { key: "soulMagnet", label: "Soul Magnet", button: () => refs.buySoulMagnetBtn() },
    { key: "glassCannon", label: "Glass Cannon", button: () => refs.buyGlassCannonBtn() },
  ];

  const STACK_ITEM_BINDINGS = [
    { key: "damageBoost", label: "Damage Boost", button: () => refs.buyDamageBtn(), handlerName: "buyDamageBoost" },
    { key: "speedBoost", label: "Speed Boost", button: () => refs.buySpeedBtn(), handlerName: "buySpeedBoost" },
    { key: "armorBoost", label: "Armor Boost", button: () => refs.buyArmorBoostBtn(), handlerName: "buyArmorBoost" },
    { key: "critBoost", label: "Crit Boost", button: () => refs.buyCritBoostBtn(), handlerName: "buyCritBoost" },
  ];

  function notify(type, message, duration = 3200) {
    if (window.solRunnerNotify && typeof window.solRunnerNotify[type] === "function") {
      window.solRunnerNotify[type](message, duration);
      return;
    }

    console[type === "error" ? "error" : "log"](message);
  }

  function isAuthenticated() {
    if (window.solRunnerAuthService?.isAuthenticated) {
      return window.solRunnerAuthService.isAuthenticated();
    }

    return !!window.solRunnerWalletService?.isAuthenticated?.();
  }

  function getProfileService() {
    return window.solRunnerProfileService || null;
  }

  function getProfile() {
    return getProfileService()?.loadProfile?.() || null;
  }

  function getPendingReward() {
    return getProfileService()?.loadPendingReward?.() || null;
  }

  function getSkinInfo(skinName) {
    return getProfileService()?.getSkinByName?.(skinName) || null;
  }

  function getItemCatalog() {
    return getProfileService()?.getItemCatalog?.() || {};
  }

  function formatSol(value) {
    return `${Number(value || 0).toFixed(4)} SOL`;
  }

  function setStoreTab(tab) {
    [refs.tabCharacters(), refs.tabWeapons(), refs.tabRelics()].forEach((panel) => {
      panel?.classList.remove("active");
    });

    [refs.tabCharactersBtn(), refs.tabWeaponsBtn(), refs.tabRelicsBtn()].forEach((btn) => {
      btn?.classList.remove("active");
    });

    if (tab === "characters") {
      refs.tabCharacters()?.classList.add("active");
      refs.tabCharactersBtn()?.classList.add("active");
    }

    if (tab === "weapons") {
      refs.tabWeapons()?.classList.add("active");
      refs.tabWeaponsBtn()?.classList.add("active");
    }

    if (tab === "relics") {
      refs.tabRelics()?.classList.add("active");
      refs.tabRelicsBtn()?.classList.add("active");
    }
  }

  function emitProfileChanged() {
    window.dispatchEvent(
      new CustomEvent("solrunner:profile-changed", {
        detail: {
          profile: getProfile(),
          pendingReward: getPendingReward(),
        },
      })
    );
  }

  function setSkinUi({ card, state, button, skinName, profile }) {
    if (!card || !state || !button || !profile) return;

    const skinInfo = getSkinInfo(skinName);
    const priceText = skinInfo ? formatSol(skinInfo.price || 0) : "";
    const owned = !!profile.ownedSkins?.[skinName];
    const equipped = profile.equippedSkin === skinName;

    card.classList.remove("shop-card--equipped", "shop-card--owned");
    button.classList.remove("shop-btn--equipped", "shop-btn--owned");
    button.disabled = false;
    button.title = "";

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
      button.classList.add("shop-btn--owned");
      return;
    }

    state.textContent = "No comprado";
    state.className = "shop-owned-badge";
    button.textContent = "Comprar";
    button.title = priceText;
  }

  function setOneTimeItemButton(button, owned, label, cost) {
    if (!button) return;

    button.classList.remove("shop-btn--owned", "shop-btn--equipped");
    button.disabled = false;
    button.title = "";

    if (owned) {
      button.textContent = "Comprado";
      button.disabled = true;
      button.classList.add("shop-btn--owned");
      return;
    }

    button.textContent = "Comprar";
    button.title = `${label} · ${formatSol(cost)}`;
  }

  function setStackItemButton(button, count, label, cost) {
    if (!button) return;

    const level = Number(count || 0);

    button.classList.remove("shop-btn--owned", "shop-btn--equipped");
    button.disabled = false;
    button.textContent = level > 0 ? `Mejorar (${level})` : "Comprar";
    button.title = `${label} · ${formatSol(cost)}`;
  }

  function refreshProfileUi() {
    const profile = getProfile();
    const pendingReward = getPendingReward();
    const profileService = getProfileService();
    const itemCatalog = getItemCatalog();

    if (!profile || !profileService) return;

    const sol = Number(profile.sol || 0).toFixed(4);

    if (refs.coinsLabel()) refs.coinsLabel().textContent = sol;
    if (refs.coinsLabelTop()) refs.coinsLabelTop().textContent = sol;
    if (refs.storeSolLabel()) refs.storeSolLabel().textContent = sol;

    if (refs.rewardStatus()) {
      refs.rewardStatus().textContent = pendingReward
        ? `${Number(pendingReward.rewardAmountSol || 0).toFixed(4)} SOL pendiente`
        : "No disponible";
    }

    if (refs.equippedSkinLabel()) refs.equippedSkinLabel().textContent = profile.equippedSkin;
    if (refs.equippedSkinStoreLabel()) refs.equippedSkinStoreLabel().textContent = profile.equippedSkin;

    if (refs.damageLabel()) refs.damageLabel().textContent = String(profile.damage ?? 0);
    if (refs.speedLabel()) refs.speedLabel().textContent = String(profile.speed ?? 0);
    if (refs.armorLabel()) refs.armorLabel().textContent = String(profile.armor ?? 0);
    if (refs.critLabel()) refs.critLabel().textContent = String(profile.critChance ?? 0);

    if (refs.claimRewardBtn()) {
      refs.claimRewardBtn().disabled = !isAuthenticated() || !pendingReward;
    }

    SKIN_BINDINGS.forEach((binding) => {
      setSkinUi({
        card: binding.card(),
        state: binding.state(),
        button: binding.button(),
        skinName: binding.key,
        profile,
      });
    });

    STACK_ITEM_BINDINGS.forEach((binding) => {
      const button = binding.button();
      const cost = itemCatalog?.[binding.key]?.price || 0;
      const count = profile.ownedItems?.[binding.key] || 0;

      setStackItemButton(button, count, binding.label, cost);
    });

    ONE_TIME_ITEM_BINDINGS.forEach((binding) => {
      const button = binding.button();
      const cost = itemCatalog?.[binding.key]?.price || 0;
      const owned = !!profile.ownedItems?.[binding.key];

      setOneTimeItemButton(button, owned, binding.label, cost);
    });

    if (refs.ownedSkinsCountLabel()) {
      const ownedCount = profileService.countOwnedSkins?.(profile) || 0;
      const totalCount = profileService.getTotalSkins?.() || 0;
      refs.ownedSkinsCountLabel().textContent = `${ownedCount} / ${totalCount}`;
    }
  }

  function buySkin(skinName) {
    const profile = getProfile();
    const profileService = getProfileService();
    const skinInfo = getSkinInfo(skinName);

    if (!profile || !profileService || !skinInfo) return;

    const result = profileService.buySkin?.(profile, skinName, skinInfo.price || 0);

    if (!result?.ok) {
      notify("error", "No tienes suficiente SOL.");
      return;
    }

    notify("success", `${skinName} comprado y equipado.`);
    refreshProfileUi();
    emitProfileChanged();
  }

  function equipSkinOnly(skinName) {
    const profile = getProfile();
    const profileService = getProfileService();

    if (!profile || !profileService) return;

    profileService.equipSkin?.(profile, skinName);
    notify("success", `${skinName} equipado.`);
    refreshProfileUi();
    emitProfileChanged();
  }

  function handleSkinPurchaseOrEquip(skinName) {
    const profile = getProfile();
    if (!profile) return;

    if (!profile.ownedSkins?.[skinName]) {
      buySkin(skinName);
      return;
    }

    if (profile.equippedSkin !== skinName) {
      equipSkinOnly(skinName);
    }
  }

  function buyOneTimeItem(key, label) {
    const profile = getProfile();
    const profileService = getProfileService();
    const itemCatalog = getItemCatalog();
    const cost = itemCatalog?.[key]?.price || 0;

    if (!profile || !profileService) return;

    const result = profileService.buyOneTimeItem?.(profile, key, cost);

    if (!result?.ok) {
      notify(
        "error",
        result.reason === "ALREADY_OWNED"
          ? `${label} ya fue comprado.`
          : "No tienes suficiente SOL."
      );
      return;
    }

    notify("success", `${label} comprado.`);
    refreshProfileUi();
    emitProfileChanged();
  }

  function buyStackItem(handlerName, successLabel) {
    const profile = getProfile();
    const profileService = getProfileService();

    if (!profile || !profileService || typeof profileService[handlerName] !== "function") {
      return;
    }

    const result = profileService[handlerName](profile);

    if (!result?.ok) {
      notify("error", "No tienes suficiente SOL.");
      return;
    }

    notify("success", `${successLabel} comprado.`);
    refreshProfileUi();
    emitProfileChanged();
  }

  function bindStoreTabs() {
    refs.tabCharactersBtn()?.addEventListener("click", () => setStoreTab("characters"));
    refs.tabWeaponsBtn()?.addEventListener("click", () => setStoreTab("weapons"));
    refs.tabRelicsBtn()?.addEventListener("click", () => setStoreTab("relics"));
  }

  function bindStoreScreen() {
    SKIN_BINDINGS.forEach((binding) => {
      binding.button()?.addEventListener("click", () => {
        handleSkinPurchaseOrEquip(binding.key);
      });
    });

    STACK_ITEM_BINDINGS.forEach((binding) => {
      binding.button()?.addEventListener("click", () => {
        buyStackItem(binding.handlerName, binding.label);
      });
    });

    ONE_TIME_ITEM_BINDINGS.forEach((binding) => {
      binding.button()?.addEventListener("click", () => {
        buyOneTimeItem(binding.key, binding.label);
      });
    });

    bindStoreTabs();

    window.addEventListener("solrunner:auth-changed", refreshProfileUi);
    window.addEventListener("solrunner:profile-changed", refreshProfileUi);
  }

  function initStoreScreen() {
    bindStoreScreen();
    setStoreTab("characters");
    refreshProfileUi();
  }

  window.solRunnerStoreScreen = {
    initStoreScreen,
    refreshProfileUi,
    setStoreTab,
    handleSkinPurchaseOrEquip,
    buyOneTimeItem,
    buyStackItem,
  };
})();