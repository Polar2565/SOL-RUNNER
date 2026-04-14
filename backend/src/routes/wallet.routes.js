const express = require("express");
const { getWalletInfo } = require("../controllers/wallet.controller");

const router = express.Router();

router.get("/", getWalletInfo);

module.exports = router;