const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const env = require("./config/env");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const runRoutes = require("./routes/run.routes");
const rewardRoutes = require("./routes/rewards.routes");
const gameRoutes = require("./routes/game.routes");
const paymentsRoutes = require("./routes/payments.routes");
const walletRoutes = require("./routes/wallet.routes");

const {
  notFoundMiddleware,
  errorMiddleware,
} = require("./middlewares/error.middleware");

const app = express();
const PORT = env.PORT;

const FRONTEND_PATH = path.join(__dirname, "..", "..", "frontend");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(FRONTEND_PATH));

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/run", runRoutes);
app.use("/reward", rewardRoutes);
app.use("/game", gameRoutes);
app.use("/payments", paymentsRoutes);
app.use("/wallet", walletRoutes);

app.get("/", (req, res) => {
  return res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = {
  app,
  PORT,
};