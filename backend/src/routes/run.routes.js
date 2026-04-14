const express = require("express");

const {
  startRunController,
  completeRunController,
  abandonRunController,
} = require("../controllers/run.controller");

const router = express.Router();

router.post("/start", startRunController);
router.post("/complete", completeRunController);
router.post("/abandon", abandonRunController);

module.exports = router;