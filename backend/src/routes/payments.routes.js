const express = require("express");
const {
  getEntryPayment,
  verifyEntryPaymentController,
} = require("../controllers/payments.controller");

const router = express.Router();

router.get("/entry/:floor", getEntryPayment);
router.post("/verify-entry", verifyEntryPaymentController);

module.exports = router;