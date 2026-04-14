const economyConfig = {
  targetKills: {
    base: 50,
    incrementPerFloor: 25,
  },
  entryFee: {
    baseFeeSol: 0.01,
    multiplierStepPerFloor: 0.2,
  },
  lossPenaltyRates: [
    { minFloor: 1, maxFloor: 2, rate: 0.1 },
    { minFloor: 3, maxFloor: 4, rate: 0.15 },
    { minFloor: 5, maxFloor: 6, rate: 0.2 },
    { minFloor: 7, maxFloor: Number.MAX_SAFE_INTEGER, rate: 0.25 },
  ],
  reward: {
    multiplier: 1.2,
    bossBonusPerFloorSol: 0.002,
  },
};

function getEconomyConfig() {
  return {
    targetKills: { ...economyConfig.targetKills },
    entryFee: { ...economyConfig.entryFee },
    lossPenaltyRates: economyConfig.lossPenaltyRates.map((item) => ({ ...item })),
    reward: { ...economyConfig.reward },
  };
}

function getTargetKillsConfig() {
  return { ...economyConfig.targetKills };
}

function getEntryFeeConfig() {
  return { ...economyConfig.entryFee };
}

function getLossPenaltyRates() {
  return economyConfig.lossPenaltyRates.map((item) => ({ ...item }));
}

function getRewardConfig() {
  return { ...economyConfig.reward };
}

function setTargetKillsConfig(config = {}) {
  economyConfig.targetKills = {
    ...economyConfig.targetKills,
    ...config,
  };
  return getTargetKillsConfig();
}

function setEntryFeeConfig(config = {}) {
  economyConfig.entryFee = {
    ...economyConfig.entryFee,
    ...config,
  };
  return getEntryFeeConfig();
}

function setLossPenaltyRates(rates = []) {
  if (!Array.isArray(rates)) {
    throw new Error("rates debe ser un arreglo");
  }

  economyConfig.lossPenaltyRates = rates.map((item) => ({
    minFloor: Number(item.minFloor),
    maxFloor: Number(item.maxFloor),
    rate: Number(item.rate),
  }));

  return getLossPenaltyRates();
}

function setRewardConfig(config = {}) {
  economyConfig.reward = {
    ...economyConfig.reward,
    ...config,
  };
  return getRewardConfig();
}

module.exports = {
  getEconomyConfig,
  getTargetKillsConfig,
  getEntryFeeConfig,
  getLossPenaltyRates,
  getRewardConfig,
  setTargetKillsConfig,
  setEntryFeeConfig,
  setLossPenaltyRates,
  setRewardConfig,
};