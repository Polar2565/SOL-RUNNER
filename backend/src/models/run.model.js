function createActiveRunModel({
  runId,
  walletAddress,
  floor,
  targetKills,
  entryFeeSol,
  entryFeeLamports,
  entryTxSignature,
  startedAt = null,
  status = "active",
}) {
  return {
    runId: String(runId || "").trim(),
    walletAddress: String(walletAddress || "").trim(),
    floor: Math.max(1, Number(floor) || 1),
    targetKills: Math.max(0, Number(targetKills) || 0),
    entryFeeSol: Number(entryFeeSol || 0),
    entryFeeLamports: Math.max(0, Number(entryFeeLamports) || 0),
    entryTxSignature: String(entryTxSignature || "").trim(),
    startedAt: startedAt || new Date().toISOString(),
    status,
  };
}

function createCompletedRunModel({
  runId,
  walletAddress,
  floor,
  targetKills,
  kills,
  bossDefeated,
  rewardAmountSol,
  entryFeeSol,
  entryFeeLamports,
  entryTxSignature,
  startedAt,
  completedAt = null,
  rewardClaimed = false,
  txSignature = null,
  status = "completed_pending_claim",
}) {
  return {
    runId: String(runId || "").trim(),
    walletAddress: String(walletAddress || "").trim(),
    floor: Math.max(1, Number(floor) || 1),
    targetKills: Math.max(0, Number(targetKills) || 0),
    kills: Math.max(0, Number(kills) || 0),
    bossDefeated: bossDefeated === true,
    rewardAmountSol: Number(rewardAmountSol || 0),
    entryFeeSol: Number(entryFeeSol || 0),
    entryFeeLamports: Math.max(0, Number(entryFeeLamports) || 0),
    entryTxSignature: String(entryTxSignature || "").trim(),
    startedAt: startedAt || new Date().toISOString(),
    completedAt: completedAt || new Date().toISOString(),
    rewardClaimed: rewardClaimed === true,
    txSignature: txSignature ? String(txSignature).trim() : null,
    status,
  };
}

module.exports = {
  createActiveRunModel,
  createCompletedRunModel,
};