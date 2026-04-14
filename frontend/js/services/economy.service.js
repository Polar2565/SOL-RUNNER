(function () {
  function getSafeFloor(floor) {
    return Math.max(1, Number(floor) || 1);
  }

  function getTargetKillsLocal(floor) {
    return 50 + (getSafeFloor(floor) - 1) * 25;
  }

  function getEntryFeeLocal(floor) {
    const safeFloor = getSafeFloor(floor);
    const baseFee = 0.01;
    const multiplier = 1 + (safeFloor - 1) * 0.2;
    return Number((baseFee * multiplier).toFixed(4));
  }

  function getLossPenaltyRateLocal(floor) {
    const safeFloor = getSafeFloor(floor);

    if (safeFloor <= 2) return 0.1;
    if (safeFloor <= 4) return 0.15;
    if (safeFloor <= 6) return 0.2;

    return 0.25;
  }

  function getLossPenaltyLocal(floor) {
    const entryFee = getEntryFeeLocal(floor);
    const penaltyRate = getLossPenaltyRateLocal(floor);
    return Number((entryFee * penaltyRate).toFixed(4));
  }

  function getRewardAmountLocal(floor) {
    const safeFloor = getSafeFloor(floor);
    const entryFee = getEntryFeeLocal(safeFloor);
    const rewardMultiplier = 1.2;
    const bossBonus = 0.002 * safeFloor;

    return Number((entryFee * rewardMultiplier + bossBonus).toFixed(4));
  }

  function createLocalPreview(floor) {
    const safeFloor = getSafeFloor(floor);

    return {
      floor: safeFloor,
      targetKills: getTargetKillsLocal(safeFloor),
      entryFeeSol: getEntryFeeLocal(safeFloor),
      lossPenaltySol: getLossPenaltyLocal(safeFloor),
      rewardAmountSol: getRewardAmountLocal(safeFloor),
    };
  }

  async function getPreview(floor) {
    const safeFloor = getSafeFloor(floor);

    try {
      const response = await fetch(`/game/economy/${safeFloor}`);
      const data = await response.json();

      if (!response.ok || !data.ok || !data.data) {
        throw new Error(data?.message || "No se pudo obtener la economía");
      }

      return data.data;
    } catch (error) {
      console.warn("Fallback economía local:", error);
      return createLocalPreview(safeFloor);
    }
  }

  function formatSol(value) {
    return `${Number(value || 0).toFixed(4)} SOL`;
  }

  window.solRunnerEconomyService = {
    getPreview,
    formatSol,
    createLocalPreview,
  };
})();