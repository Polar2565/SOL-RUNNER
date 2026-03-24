const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const nacl = require("tweetnacl");
const { TextEncoder } = require("util");
const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");

const bs58Module = require("bs58");
const bs58 = bs58Module.default || bs58Module;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_PATH = path.join(__dirname, "..", "frontend");
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

const connection = new Connection(RPC_URL, "confirmed");

// memoria temporal
const nonces = new Map();
const sessions = new Map();

// una run pendiente por sesión
const pendingRuns = new Map();

// historial simple por sesión
const runHistory = new Map();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(FRONTEND_PATH));

function getRewardWallet() {
  const raw = process.env.REWARD_WALLET_SECRET_KEY;

  if (!raw) {
    throw new Error("Falta REWARD_WALLET_SECRET_KEY en .env");
  }

  const secret = JSON.parse(raw);
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function getTargetKillsForFloor(floor) {
  return 50 + (Math.max(1, Number(floor)) - 1) * 25;
}

function getRewardAmountForFloor(floor) {
  const parsedFloor = Math.max(1, Number(floor) || 1);
  return Number((0.0005 + (parsedFloor - 1) * 0.0001).toFixed(4));
}

app.get("/health", async (req, res) => {
  try {
    const rewardWallet = getRewardWallet();
    const balance = await connection.getBalance(rewardWallet.publicKey);

    return res.json({
      ok: true,
      message: "Backend funcionando",
      port: PORT,
      rpc: RPC_URL,
      rewardWallet: rewardWallet.publicKey.toBase58(),
      rewardWalletBalanceSol: balance / LAMPORTS_PER_SOL,
      activeSessions: sessions.size,
      pendingRuns: pendingRuns.size,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Backend funcionando, pero wallet reward inválida",
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  return res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

app.post("/auth/nonce", (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return res.status(400).json({
        ok: false,
        message: "walletAddress es requerido",
      });
    }

    const cleanWallet = walletAddress.trim();
    const nonce = `Login Solana Game :: ${cleanWallet} :: ${Date.now()}`;

    nonces.set(cleanWallet, nonce);

    return res.json({
      ok: true,
      nonce,
    });
  } catch (error) {
    console.error("ERROR NONCE:", error);

    return res.status(500).json({
      ok: false,
      message: "Error generando nonce",
      error: error.message,
    });
  }
});

app.post("/auth/verify", (req, res) => {
  try {
    const { walletAddress, signature, signedMessage } = req.body;

    if (!walletAddress || !signature || !signedMessage) {
      return res.status(400).json({
        ok: false,
        message: "walletAddress, signature y signedMessage son requeridos",
      });
    }

    const cleanWallet = walletAddress.trim();
    const savedNonce = nonces.get(cleanWallet);

    if (!savedNonce) {
      return res.status(400).json({
        ok: false,
        message: "Nonce no encontrado",
      });
    }

    if (savedNonce !== signedMessage) {
      return res.status(400).json({
        ok: false,
        message: "El mensaje firmado no coincide con el nonce",
      });
    }

    const messageBytes = new TextEncoder().encode(signedMessage);
    const signatureBytes = Uint8Array.from(Buffer.from(signature, "base64"));
    const publicKeyBytes = bs58.decode(cleanWallet);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return res.status(401).json({
        ok: false,
        message: "Firma inválida",
      });
    }

    const sessionToken = `session_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    sessions.set(sessionToken, {
      walletAddress: cleanWallet,
      createdAt: new Date().toISOString(),
    });

    if (!runHistory.has(sessionToken)) {
      runHistory.set(sessionToken, []);
    }

    nonces.delete(cleanWallet);

    return res.json({
      ok: true,
      message: "Firma válida",
      sessionToken,
      walletAddress: cleanWallet,
    });
  } catch (error) {
    console.error("ERROR VERIFY:", error);

    return res.status(500).json({
      ok: false,
      message: "Error verificando firma",
      error: error.message,
    });
  }
});

app.post("/run/complete", (req, res) => {
  try {
    const { sessionToken, kills, bossDefeated, floor, targetKills } = req.body;

    if (!sessionToken) {
      return res.status(401).json({
        ok: false,
        message: "sessionToken es requerido",
      });
    }

    const session = sessions.get(sessionToken);

    if (!session) {
      return res.status(401).json({
        ok: false,
        message: "Sesión inválida",
      });
    }

    const existingPendingRun = pendingRuns.get(sessionToken);

    if (existingPendingRun && existingPendingRun.rewardClaimed === false) {
      return res.status(400).json({
        ok: false,
        message: "Ya tienes una recompensa pendiente. Reclámala antes de registrar otra run.",
        pendingRun: existingPendingRun,
      });
    }

    const safeFloor = Math.max(1, Number(floor) || 1);
    const expectedTargetKills =
      Number(targetKills) > 0 ? Number(targetKills) : getTargetKillsForFloor(safeFloor);

    if (Number(kills) < expectedTargetKills || bossDefeated !== true) {
      return res.status(400).json({
        ok: false,
        message: "La run no cumple las condiciones",
        expectedTargetKills,
      });
    }

    const rewardAmountSol = getRewardAmountForFloor(safeFloor);

    const runData = {
      runId: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      walletAddress: session.walletAddress,
      floor: safeFloor,
      targetKills: expectedTargetKills,
      kills: Number(kills),
      bossDefeated: true,
      rewardAmountSol,
      completedAt: new Date().toISOString(),
      rewardClaimed: false,
      txSignature: null,
    };

    pendingRuns.set(sessionToken, runData);

    const history = runHistory.get(sessionToken) || [];
    history.push({
      ...runData,
      status: "completed_pending_claim",
    });
    runHistory.set(sessionToken, history);

    return res.json({
      ok: true,
      message: "Run registrada correctamente",
      run: runData,
    });
  } catch (error) {
    console.error("ERROR RUN COMPLETE:", error);

    return res.status(500).json({
      ok: false,
      message: "Error registrando la run",
      error: error.message,
    });
  }
});

app.post("/reward/claim", async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(401).json({
        ok: false,
        message: "sessionToken es requerido",
      });
    }

    const session = sessions.get(sessionToken);
    if (!session) {
      return res.status(401).json({
        ok: false,
        message: "Sesión inválida",
      });
    }

    const run = pendingRuns.get(sessionToken);
    if (!run) {
      return res.status(400).json({
        ok: false,
        message: "No hay una run completada para reclamar",
      });
    }

    if (run.rewardClaimed) {
      return res.status(400).json({
        ok: false,
        message: "La recompensa ya fue reclamada",
        txSignature: run.txSignature,
      });
    }

    const rewardWallet = getRewardWallet();
    const destination = new PublicKey(session.walletAddress);
    const lamports = Math.floor(run.rewardAmountSol * LAMPORTS_PER_SOL);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: rewardWallet.publicKey,
        toPubkey: destination,
        lamports,
      })
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      tx,
      [rewardWallet],
      { commitment: "confirmed" }
    );

    run.rewardClaimed = true;
    run.txSignature = signature;
    pendingRuns.set(sessionToken, run);

    const history = runHistory.get(sessionToken) || [];
    const idx = history.findIndex((item) => item.runId === run.runId);
    if (idx !== -1) {
      history[idx] = {
        ...history[idx],
        rewardClaimed: true,
        txSignature: signature,
        status: "claimed",
      };
      runHistory.set(sessionToken, history);
    }

    // ya reclamada, liberamos la sesión para la siguiente run
    pendingRuns.delete(sessionToken);

    return res.json({
      ok: true,
      message: "Recompensa enviada correctamente",
      txSignature: signature,
      rewardAmountSol: run.rewardAmountSol,
      walletAddress: session.walletAddress,
      floor: run.floor,
      targetKills: run.targetKills,
    });
  } catch (error) {
    console.error("ERROR CLAIM:", error);

    return res.status(500).json({
      ok: false,
      message: "Error enviando recompensa",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});