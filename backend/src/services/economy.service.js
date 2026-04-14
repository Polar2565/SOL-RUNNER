const {
  getTargetKillsConfig,
  getEntryFeeConfig,
  getLossPenaltyRates,
  getRewardConfig,
} = require("../repositories/economy.repository");

const { createEconomyPreviewModel } = require("../models/economy.model");
const { getSafeFloor, roundToDecimals } = require("../utils/helpers");

function getTargetKillsForFloor(floor) {
  const safeFloor = getSafeFloor(floor);
  const config = getTargetKillsConfig();

  return config.base + (safeFloor - 1) * config.incrementPerFloor;
}

function getEntryFeeForFloor(floor) {
  const safeFloor = getSafeFloor(floor);
  const config = getEntryFeeConfig();

  const multiplier = 1 + (safeFloor - 1) * config.multiplierStepPerFloor;
  return roundToDecimals(config.baseFeeSol * multiplier, 4);
}

function getLossPenaltyRateForFloor(floor) {
  const safeFloor = getSafeFloor(floor);
  const ranges = getLossPenaltyRates();

  const found = ranges.find(
    (item) => safeFloor >= item.minFloor && safeFloor <= item.maxFloor
  );

  return found ? Number(found.rate) : 0.25;
}

function getLossPenaltyForFloor(floor) {
  const entryFee = getEntryFeeForFloor(floor);
  const penaltyRate = getLossPenaltyRateForFloor(floor);

  return roundToDecimals(entryFee * penaltyRate, 4);
}

function getRewardAmountForFloor(floor) {
  const safeFloor = getSafeFloor(floor);
  const entryFee = getEntryFeeForFloor(safeFloor);
  const rewardConfig = getRewardConfig();

  const reward =
    entryFee * rewardConfig.multiplier +
    rewardConfig.bossBonusPerFloorSol * safeFloor;

  return roundToDecimals(reward, 4);
}

function getEconomyPreviewForFloor(floor) {
  const safeFloor = getSafeFloor(floor);

  return createEconomyPreviewModel({
    floor: safeFloor,
    targetKills: getTargetKillsForFloor(safeFloor),
    entryFeeSol: getEntryFeeForFloor(safeFloor),
    lossPenaltySol: getLossPenaltyForFloor(safeFloor),
    rewardAmountSol: getRewardAmountForFloor(safeFloor),
    penaltyRate: getLossPenaltyRateForFloor(safeFloor),
  });
}

module.exports = {
  getTargetKillsForFloor,
  getEntryFeeForFloor,
  getLossPenaltyRateForFloor,
  getLossPenaltyForFloor,
  getRewardAmountForFloor,
  getEconomyPreviewForFloor,
};