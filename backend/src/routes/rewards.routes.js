const express = require("express");
const {
  claimRewardController,
} = require("../controllers/rewards.controller");

const router = express.Router();

router.post("/claim", claimRewardController);

module.exports = router;