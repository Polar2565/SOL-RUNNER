function createSessionModel({ sessionToken, walletAddress, createdAt = null }) {
  return {
    sessionToken: String(sessionToken || "").trim(),
    walletAddress: String(walletAddress || "").trim(),
    createdAt: createdAt || new Date().toISOString(),
  };
}

module.exports = {
  createSessionModel,
};