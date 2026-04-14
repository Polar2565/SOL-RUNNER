const express = require("express");
const { getEconomyPreview } = require("../controllers/game.controller");

const router = express.Router();

router.get("/economy/:floor", getEconomyPreview);

module.exports = router;