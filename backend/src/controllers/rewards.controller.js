const { claimReward } = require("../services/rewards.service");

async function claimRewardController(req, res) {
  try {
    const result = await claimReward(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("ERROR CLAIM:", error);

    return res.status(500).json({
      ok: false,
      message: "Error enviando recompensa",
      error: error.message,
    });
  }
}

module.exports = {
  claimRewardController,
};