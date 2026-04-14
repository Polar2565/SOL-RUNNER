function createEconomyPreviewModel({
  floor,
  targetKills,
  entryFeeSol,
  lossPenaltySol,
  rewardAmountSol,
  penaltyRate,
}) {
  return {
    floor: Math.max(1, Number(floor) || 1),
    targetKills: Math.max(0, Number(targetKills) || 0),
    entryFeeSol: Number(entryFeeSol || 0),
    lossPenaltySol: Number(lossPenaltySol || 0),
    rewardAmountSol: Number(rewardAmountSol || 0),
    penaltyRate: Number(penaltyRate || 0),
  };
}

module.exports = {
  createEconomyPreviewModel,
};