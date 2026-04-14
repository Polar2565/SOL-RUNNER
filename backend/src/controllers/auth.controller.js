const {
  getNonce,
  setNonce,
  deleteNonce,
  setSession,
} = require("../repositories/session.repository");

const {
  getRunHistoryByKey,
  setRunHistoryByKey,
} = require("../repositories/run.repository");

const {
  buildNonce,
  verifyWalletSignature,
  buildSessionToken,
  buildSessionData,
} = require("../services/auth.service");

function createNonce(req, res) {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return res.status(400).json({
        ok: false,
        message: "walletAddress es requerido",
      });
    }

    const cleanWallet = walletAddress.trim();
    const nonce = buildNonce(cleanWallet);

    setNonce(cleanWallet, nonce);

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
}

function verifyAuth(req, res) {
  try {
    const { walletAddress, signature, signedMessage } = req.body;

    if (!walletAddress || !signature || !signedMessage) {
      return res.status(400).json({
        ok: false,
        message: "walletAddress, signature y signedMessage son requeridos",
      });
    }

    const cleanWallet = walletAddress.trim();
    const savedNonce = getNonce(cleanWallet);

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

    const isValid = verifyWalletSignature({
      walletAddress: cleanWallet,
      signature,
      signedMessage,
    });

    if (!isValid) {
      return res.status(401).json({
        ok: false,
        message: "Firma inválida",
      });
    }

    const sessionToken = buildSessionToken();
    const sessionData = buildSessionData(cleanWallet);

    setSession(sessionToken, sessionData);

    const existingHistory = getRunHistoryByKey(cleanWallet);
    if (!existingHistory || existingHistory.length === 0) {
      setRunHistoryByKey(cleanWallet, []);
    }

    deleteNonce(cleanWallet);

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
}

module.exports = {
  createNonce,
  verifyAuth,
};