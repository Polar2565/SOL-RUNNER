const {
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");

const {
  connection,
  getRewardWallet,
  LAMPORTS_PER_SOL,
} = require("../config/solana");

const {
  getSession,
} = require("../repositories/session.repository");

const {
  getPendingRun,
  deletePendingRun,
  getRunHistoryByKey,
  setRunHistoryByKey,
} = require("../repositories/run.repository");

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

async function claimReward({ sessionToken }) {
  const sessionContext = getSessionContext(sessionToken);
  if (!sessionContext.ok) {
    return sessionContext.response;
  }

  const { session, runKey } = sessionContext;

  const run = getPendingRun(runKey);
  if (!run) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "No hay una run completada para reclamar",
      },
    };
  }

  if (run.rewardClaimed) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "La recompensa ya fue reclamada",
        txSignature: run.txSignature,
      },
    };
  }

  const rewardWallet = getRewardWallet();
  const destination = new PublicKey(session.walletAddress);
  const lamports = Math.floor(Number(run.rewardAmountSol || 0) * LAMPORTS_PER_SOL);

  if (!lamports || lamports <= 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "La recompensa calculada no es válida",
      },
    };
  }

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

  const history = getRunHistoryByKey(runKey);
  const idx = history.findIndex((item) => item.runId === run.runId);

  if (idx !== -1) {
    history[idx] = {
      ...history[idx],
      rewardClaimed: true,
      txSignature: signature,
      status: "claimed",
    };
  } else {
    history.push({
      ...run,
      rewardClaimed: true,
      txSignature: signature,
      status: "claimed",
    });
  }

  setRunHistoryByKey(runKey, history);
  deletePendingRun(runKey);

  return {
    status: 200,
    body: {
      ok: true,
      message: "Recompensa enviada correctamente",
      txSignature: signature,
      rewardAmountSol: run.rewardAmountSol,
      walletAddress: session.walletAddress,
      floor: run.floor,
      targetKills: run.targetKills,
    },
  };
}

module.exports = {
  claimReward,
};