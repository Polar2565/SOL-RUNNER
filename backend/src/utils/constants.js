const RUN_STATUS = {
  ACTIVE: "active",
  COMPLETED_PENDING_CLAIM: "completed_pending_claim",
  CLAIMED: "claimed",
  FAILED: "failed",
};

const NETWORKS = {
  DEVNET: "devnet",
  TESTNET: "testnet",
  MAINNET_BETA: "mainnet-beta",
};

const DEFAULTS = {
  PORT: 4000,
  SOLANA_RPC_URL: "https://api.devnet.solana.com",
  BASE_ENTRY_FEE_SOL: 0.01,
  REWARD_MULTIPLIER: 1.2,
  BOSS_BONUS_PER_FLOOR_SOL: 0.002,
  TARGET_KILLS_BASE: 50,
  TARGET_KILLS_INCREMENT: 25,
};

module.exports = {
  RUN_STATUS,
  NETWORKS,
  DEFAULTS,
};