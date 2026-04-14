const { Connection, Keypair, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const env = require("./env");

const RPC_URL = env.SOLANA_RPC_URL;
const connection = new Connection(RPC_URL, "confirmed");

let rewardWalletCache = null;

function getRewardWallet() {
  if (rewardWalletCache) {
    return rewardWalletCache;
  }

  let secret;

  try {
    secret = JSON.parse(env.REWARD_WALLET_SECRET_KEY);
  } catch (error) {
    throw new Error("REWARD_WALLET_SECRET_KEY no tiene un JSON válido");
  }

  if (!Array.isArray(secret) || secret.length === 0) {
    throw new Error("REWARD_WALLET_SECRET_KEY debe ser un arreglo JSON de bytes");
  }

  rewardWalletCache = Keypair.fromSecretKey(Uint8Array.from(secret));
  return rewardWalletCache;
}

module.exports = {
  RPC_URL,
  connection,
  getRewardWallet,
  LAMPORTS_PER_SOL,
};