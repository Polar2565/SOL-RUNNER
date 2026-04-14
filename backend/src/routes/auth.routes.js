const express = require("express");
const {
  createNonce,
  verifyAuth,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/nonce", createNonce);
router.post("/verify", verifyAuth);

module.exports = router;