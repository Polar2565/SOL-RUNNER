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
const FRONTEND_PATH = path.join(__dirname, "..", "..", "frontend");
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const NETWORK = process.env.SOLANA_NETWORK || "devnet";

const connection = new Connection(RPC_URL, "confirmed");

const nonces = new Map();
const sessions = new Map();
const activeRuns = new Map();
const pendingRuns = new Map();
const runHistory = new Map();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(FRONTEND_PATH));

function roundToDecimals(value, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(Number(value || 0) * factor) / factor;
}

function getSafeFloor(floor) {
  return Math.max(1, Number(floor) || 1);
}

function getRewardWallet() {
  const raw = process.env.REWARD_WALLET_SECRET_KEY;

  if (!raw) {
    throw new Error("Falta REWARD_WALLET_SECRET_KEY en variables de entorno");
  }

  const secret = JSON.parse(raw);
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function getTreasuryWalletPublicKey() {
  if (process.env.TREASURY_WALLET_PUBLIC_KEY) {
    return new PublicKey(process.env.TREASURY_WALLET_PUBLIC_KEY);
  }

  return getRewardWallet().publicKey;
}

function getTargetKillsForFloor(floor) {
  const safeFloor = getSafeFloor(floor);
  return 50 + (safeFloor - 1) * 25;
}

function getEntryFeeForFloor(floor) {
  const safeFloor = getSafeFloor(floor);
  const baseFeeSol = 0.01;
  const multiplier = 1 + (safeFloor - 1) * 0.2;

  return roundToDecimals(baseFeeSol * multiplier, 4);
}

function getLossPenaltyRateForFloor(floor) {
  const safeFloor = getSafeFloor(floor);

  if (safeFloor <= 2) return 0.1;
  if (safeFloor <= 4) return 0.15;
  if (safeFloor <= 6) return 0.2;

  return 0.25;
}

function getLossPenaltyForFloor(floor) {
  return roundToDecimals(
    getEntryFeeForFloor(floor) * getLossPenaltyRateForFloor(floor),
    4
  );
}

function getRewardAmountForFloor(floor) {
  const safeFloor = getSafeFloor(floor);
  const entryFee = getEntryFeeForFloor(safeFloor);

  return roundToDecimals(entryFee * 1.45 + safeFloor * 0.0005, 4);
}

function getEconomyPreviewForFloor(floor) {
  const safeFloor = getSafeFloor(floor);
  const entryFeeSol = getEntryFeeForFloor(safeFloor);

  return {
    floor: safeFloor,
    network: NETWORK,
    rpcUrl: RPC_URL,
    targetKills: getTargetKillsForFloor(safeFloor),
    entryFeeSol,
    entryFeeLamports: Math.floor(entryFeeSol * LAMPORTS_PER_SOL),
    lossPenaltySol: getLossPenaltyForFloor(safeFloor),
    rewardAmountSol: getRewardAmountForFloor(safeFloor),
    penaltyRate: getLossPenaltyRateForFloor(safeFloor),
  };
}

function getSession(sessionToken) {
  if (!sessionToken) return null;
  return sessions.get(sessionToken) || null;
}

async function verifySolTransfer({ walletAddress, txSignature, expectedLamports }) {
  if (!walletAddress || !txSignature) {
    return {
      ok: false,
      message: "walletAddress y txSignature son requeridos",
    };
  }

  const treasuryWallet = getTreasuryWalletPublicKey().toBase58();

  const tx = await connection.getParsedTransaction(txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    return {
      ok: false,
      message: "No se encontró la transacción en Solana",
    };
  }

  const instructions = tx.transaction.message.instructions || [];

  const transfer = instructions.find((instruction) => {
    const parsed = instruction.parsed;
    if (!parsed || parsed.type !== "transfer") return false;

    const info = parsed.info || {};
    const lamports = Number(info.lamports || 0);

    return (
      info.source === walletAddress &&
      info.destination === treasuryWallet &&
      lamports >= expectedLamports
    );
  });

  if (!transfer) {
    return {
      ok: false,
      message: "La transacción no coincide con el pago de entrada esperado",
    };
  }

  return {
    ok: true,
    treasuryWallet,
  };
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
      network: NETWORK,
      rewardWallet: rewardWallet.publicKey.toBase58(),
      rewardWalletBalanceSol: balance / LAMPORTS_PER_SOL,
      activeSessions: sessions.size,
      activeRuns: activeRuns.size,
      pendingRuns: pendingRuns.size,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Backend funcionando, pero la wallet reward no está configurada",
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  return res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

app.get("/game/economy/:floor", (req, res) => {
  try {
    return res.json({
      ok: true,
      data: getEconomyPreviewForFloor(req.params.floor),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Error obteniendo economía del piso",
      error: error.message,
    });
  }
});

app.get("/payments/entry/:floor", (req, res) => {
  try {
    const economy = getEconomyPreviewForFloor(req.params.floor);
    const treasuryWallet = getTreasuryWalletPublicKey().toBase58();

    return res.json({
      ok: true,
      data: {
        floor: economy.floor,
        network: NETWORK,
        rpcUrl: RPC_URL,
        treasuryWallet,
        entryFeeSol: economy.entryFeeSol,
        entryFeeLamports: economy.entryFeeLamports,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Error obteniendo configuración de pago",
      error: error.message,
    });
  }
});

app.post("/payments/verify-entry", async (req, res) => {
  try {
    const { walletAddress, floor, txSignature } = req.body;
    const economy = getEconomyPreviewForFloor(floor);

    const result = await verifySolTransfer({
      walletAddress,
      txSignature,
      expectedLamports: economy.entryFeeLamports,
    });

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.json({
      ok: true,
      message: "Pago de entrada verificado",
      data: {
        walletAddress,
        txSignature,
        floor: economy.floor,
        entryFeeSol: economy.entryFeeSol,
        entryFeeLamports: economy.entryFeeLamports,
        treasuryWallet: result.treasuryWallet,
      },
    });
  } catch (error) {
    console.error("ERROR VERIFY ENTRY:", error);

    return res.status(500).json({
      ok: false,
      message: "Error verificando pago de entrada",
      error: error.message,
    });
  }
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

app.post("/run/start", (req, res) => {
  try {
    const { sessionToken, floor, txSignature } = req.body;

    const session = getSession(sessionToken);

    if (!session) {
      return res.status(401).json({
        ok: false,
        message: "Sesión inválida",
      });
    }

    if (activeRuns.has(sessionToken)) {
      return res.status(400).json({
        ok: false,
        message: "Ya tienes una run activa",
        run: activeRuns.get(sessionToken),
      });
    }

    const economy = getEconomyPreviewForFloor(floor);

    const run = {
      runId: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      walletAddress: session.walletAddress,
      floor: economy.floor,
      targetKills: economy.targetKills,
      entryFeeSol: economy.entryFeeSol,
      entryFeeLamports: economy.entryFeeLamports,
      rewardAmountSol: economy.rewardAmountSol,
      txSignature: txSignature || null,
      startedAt: new Date().toISOString(),
      rewardClaimed: false,
      status: "active",
    };

    activeRuns.set(sessionToken, run);

    return res.json({
      ok: true,
      message: "Run iniciada correctamente",
      run,
    });
  } catch (error) {
    console.error("ERROR RUN START:", error);

    return res.status(500).json({
      ok: false,
      message: "Error iniciando run",
      error: error.message,
    });
  }
});

app.post("/run/abandon", (req, res) => {
  try {
    const { sessionToken, kills = 0, reason = "abandoned" } = req.body;

    const session = getSession(sessionToken);

    if (!session) {
      return res.status(200).json({
        ok: true,
        message: "No había sesión activa para cerrar",
      });
    }

    const activeRun = activeRuns.get(sessionToken);

    if (!activeRun) {
      return res.status(200).json({
        ok: true,
        message: "No había una run activa para cerrar",
      });
    }

    const runData = {
      ...activeRun,
      kills: Math.max(0, Number(kills) || 0),
      bossDefeated: false,
      endedAt: new Date().toISOString(),
      status: reason,
    };

    activeRuns.delete(sessionToken);

    const history = runHistory.get(sessionToken) || [];
    history.push(runData);
    runHistory.set(sessionToken, history);

    return res.json({
      ok: true,
      message: "Run cerrada correctamente",
      run: runData,
    });
  } catch (error) {
    console.error("ERROR RUN ABANDON:", error);

    return res.status(500).json({
      ok: false,
      message: "Error cerrando run",
      error: error.message,
    });
  }
});

app.post("/run/complete", (req, res) => {
  try {
    const { sessionToken, kills, bossDefeated, floor, targetKills } = req.body;

    const session = getSession(sessionToken);

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
        message:
          "Ya tienes una recompensa pendiente. Reclámala antes de registrar otra run.",
        pendingRun: existingPendingRun,
      });
    }

    const safeFloor = getSafeFloor(floor);
    const activeRun = activeRuns.get(sessionToken);
    const expectedTargetKills =
      Number(targetKills) > 0
        ? Number(targetKills)
        : getTargetKillsForFloor(safeFloor);

    if (Number(kills) < expectedTargetKills || bossDefeated !== true) {
      return res.status(400).json({
        ok: false,
        message: "La run no cumple las condiciones",
        expectedTargetKills,
      });
    }

    const rewardAmountSol = activeRun
      ? activeRun.rewardAmountSol
      : getRewardAmountForFloor(safeFloor);

    const runData = {
      runId:
        activeRun?.runId ||
        `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      walletAddress: session.walletAddress,
      floor: safeFloor,
      targetKills: expectedTargetKills,
      kills: Number(kills),
      bossDefeated: true,
      rewardAmountSol,
      entryFeeSol: activeRun?.entryFeeSol || getEntryFeeForFloor(safeFloor),
      entryFeeLamports:
        activeRun?.entryFeeLamports ||
        Math.floor(getEntryFeeForFloor(safeFloor) * LAMPORTS_PER_SOL),
      entryTxSignature: activeRun?.txSignature || null,
      completedAt: new Date().toISOString(),
      rewardClaimed: false,
      txSignature: null,
      status: "completed_pending_claim",
    };

    activeRuns.delete(sessionToken);
    pendingRuns.set(sessionToken, runData);

    const history = runHistory.get(sessionToken) || [];
    history.push(runData);
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

    const session = getSession(sessionToken);

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
    run.status = "claimed";
    pendingRuns.delete(sessionToken);

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