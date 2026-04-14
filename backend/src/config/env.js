function getRequiredEnv(name) {
  const value = process.env[name];

  if (value === undefined || value === null || value === "") {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }

  return value;
}

function getOptionalEnv(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === null || value === ""
    ? fallback
    : value;
}

const env = {
  PORT: Number(getOptionalEnv("PORT", 4000)),
  SOLANA_RPC_URL: getOptionalEnv("SOLANA_RPC_URL", "https://api.devnet.solana.com"),
  REWARD_WALLET_SECRET_KEY: getRequiredEnv("REWARD_WALLET_SECRET_KEY"),
};

module.exports = env;