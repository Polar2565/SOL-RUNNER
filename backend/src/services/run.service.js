const {
  getSession,
} = require("../repositories/session.repository");

const {
  getPendingRun,
  setPendingRun,
  getActiveRun,
  setActiveRun,
  deleteActiveRun,
  getRunHistoryByKey,
  setRunHistoryByKey,
  getUsedEntryPayment,
  setUsedEntryPayment,
} = require("../repositories/run.repository");

const {
  getTargetKillsForFloor,
  getRewardAmountForFloor,
} = require("./economy.service");

const {
  verifyEntryPayment,
  getEntryPaymentConfig,
} = require("./payments.service");

function getSafeFloor(floor) {
  return Math.max(1, Number(floor) || 1);
}

function getSafeTxSignature(txSignature) {
  return typeof txSignature === "string" ? txSignature.trim() : "";
}

function getSessionContext(sessionToken) {
  if (!sessionToken) {
    return {
      ok: false,
      response: {
        status: 401,
        body: {
          ok: false,
          message: "sessionToken es requerido",
        },
      },
    };
  }

  const session = getSession(sessionToken);

  if (!session) {
    return {
      ok: false,
      response: {
        status: 401,
        body: {
          ok: false,
          message: "Sesión inválida",
        },
      },
    };
  }

  if (!session.walletAddress) {
    return {
      ok: false,
      response: {
        status: 400,
        body: {
          ok: false,
          message: "La sesión no tiene walletAddress válido",
        },
      },
    };
  }

  return {
    ok: true,
    session,
    runKey: session.walletAddress,
  };
}

async function startRun({ sessionToken, floor, txSignature }) {
  const sessionContext = getSessionContext(sessionToken);
  if (!sessionContext.ok) {
    return sessionContext.response;
  }

  const { session, runKey } = sessionContext;

  const safeFloor = getSafeFloor(floor);
  const safeTxSignature = getSafeTxSignature(txSignature);

  if (!floor) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "floor es requerido",
      },
    };
  }

  if (!safeTxSignature) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "txSignature es requerido",
      },
    };
  }

  const existingPendingRun = getPendingRun(runKey);
  if (existingPendingRun && existingPendingRun.rewardClaimed === false) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Ya tienes una recompensa pendiente. Reclámala antes de iniciar otra run.",
      },
    };
  }

  const existingActiveRun = getActiveRun(runKey);
  if (existingActiveRun) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Ya tienes una run activa",
        run: existingActiveRun,
      },
    };
  }

  const reusedPayment = getUsedEntryPayment(safeTxSignature);
  if (reusedPayment) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Esta transacción de entrada ya fue utilizada",
        usedByWallet: reusedPayment.walletAddress,
        usedAt: reusedPayment.usedAt,
        floor: reusedPayment.floor,
      },
    };
  }

  const paymentResult = await verifyEntryPayment({
    walletAddress: session.walletAddress,
    floor: safeFloor,
    txSignature: safeTxSignature,
  });

  if (!paymentResult.body.ok) {
    return paymentResult;
  }

  const paymentConfig = getEntryPaymentConfig(safeFloor);

  setUsedEntryPayment(safeTxSignature, {
    walletAddress: session.walletAddress,
    floor: safeFloor,
    usedAt: new Date().toISOString(),
  });

  const activeRun = {
    runId: `active_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    walletAddress: session.walletAddress,
    floor: safeFloor,
    targetKills: getTargetKillsForFloor(safeFloor),
    entryFeeSol: paymentConfig.entryFeeSol,
    entryFeeLamports: paymentConfig.entryFeeLamports,
    entryTxSignature: safeTxSignature,
    startedAt: new Date().toISOString(),
    status: "active",
  };

  setActiveRun(runKey, activeRun);

  return {
    status: 200,
    body: {
      ok: true,
      message: "Run iniciada correctamente",
      run: activeRun,
    },
  };
}

function completeRun({ sessionToken, kills, bossDefeated }) {
  const sessionContext = getSessionContext(sessionToken);
  if (!sessionContext.ok) {
    return sessionContext.response;
  }

  const { session, runKey } = sessionContext;

  const activeRun = getActiveRun(runKey);

  if (!activeRun) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "No tienes una run activa. Primero debes iniciar la run con un pago válido.",
      },
    };
  }

  const safeKills = Math.max(0, Number(kills) || 0);
  const expectedTargetKills = activeRun.targetKills;

  if (safeKills < expectedTargetKills || bossDefeated !== true) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "La run no cumple las condiciones",
        expectedTargetKills,
      },
    };
  }

  const rewardAmountSol = getRewardAmountForFloor(activeRun.floor);

  const runData = {
    runId: activeRun.runId,
    walletAddress: session.walletAddress,
    floor: activeRun.floor,
    targetKills: expectedTargetKills,
    kills: safeKills,
    bossDefeated: true,
    rewardAmountSol,
    entryFeeSol: activeRun.entryFeeSol,
    entryFeeLamports: activeRun.entryFeeLamports,
    entryTxSignature: activeRun.entryTxSignature,
    startedAt: activeRun.startedAt,
    completedAt: new Date().toISOString(),
    rewardClaimed: false,
    txSignature: null,
  };

  setPendingRun(runKey, runData);
  deleteActiveRun(runKey);

  const history = getRunHistoryByKey(runKey);
  history.push({
    ...runData,
    status: "completed_pending_claim",
  });
  setRunHistoryByKey(runKey, history);

  return {
    status: 200,
    body: {
      ok: true,
      message: "Run registrada correctamente",
      run: runData,
    },
  };
}

function abandonRun({ sessionToken, kills = 0, reason = "abandoned" }) {
  const sessionContext = getSessionContext(sessionToken);
  if (!sessionContext.ok) {
    return sessionContext.response;
  }

  const { session, runKey } = sessionContext;
  const activeRun = getActiveRun(runKey);

  if (!activeRun) {
    return {
      status: 200,
      body: {
        ok: true,
        message: "No había una run activa para cerrar",
      },
    };
  }

  const safeKills = Math.max(0, Number(kills) || 0);
  const safeReason =
    reason === "failed" || reason === "logout" || reason === "abandoned"
      ? reason
      : "abandoned";

  const runData = {
    runId: activeRun.runId,
    walletAddress: session.walletAddress,
    floor: activeRun.floor,
    targetKills: activeRun.targetKills,
    kills: safeKills,
    bossDefeated: false,
    rewardAmountSol: 0,
    entryFeeSol: activeRun.entryFeeSol,
    entryFeeLamports: activeRun.entryFeeLamports,
    entryTxSignature: activeRun.entryTxSignature,
    startedAt: activeRun.startedAt,
    endedAt: new Date().toISOString(),
    rewardClaimed: false,
    txSignature: null,
    status: safeReason,
  };

  deleteActiveRun(runKey);

  const history = getRunHistoryByKey(runKey);
  history.push(runData);
  setRunHistoryByKey(runKey, history);

  return {
    status: 200,
    body: {
      ok: true,
      message: "Run cerrada correctamente",
      run: runData,
    },
  };
}

module.exports = {
  startRun,
  completeRun,
  abandonRun,
};