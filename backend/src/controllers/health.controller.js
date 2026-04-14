const env = require("../config/env");
const {
  getRewardWallet,
  connection,
  LAMPORTS_PER_SOL,
  RPC_URL,
} = require("../config/solana");

const {
  getSessionsCount,
  getPendingRunsCount,
  getActiveRunsCount,
  getUsedEntryPaymentsCount,
} = require("../services/state.service");

async function getHealth(req, res) {
  try {
    const rewardWallet = getRewardWallet();
    const balanceLamports = await connection.getBalance(rewardWallet.publicKey);
    const balanceSol = Number((balanceLamports / LAMPORTS_PER_SOL).toFixed(6));

    return res.json({
      ok: true,
      message: "Backend funcionando",
      port: env.PORT,
      rpc: RPC_URL,
      rewardWallet: rewardWallet.publicKey.toBase58(),
      rewardWalletBalanceSol: balanceSol,
      activeSessions: getSessionsCount(),
      activeRuns: getActiveRunsCount(),
      pendingRuns: getPendingRunsCount(),
      usedEntryPayments: getUsedEntryPaymentsCount(),
    });
  } catch (error) {
    console.error("ERROR HEALTH:", error);

    return res.status(500).json({
      ok: false,
      message: "Backend funcionando, pero wallet reward inválida",
      error: error.message,
    });
  }
}

module.exports = {
  getHealth,
};