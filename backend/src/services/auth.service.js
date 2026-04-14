const nacl = require("tweetnacl");
const { TextEncoder } = require("util");

const bs58Module = require("bs58");
const bs58 = bs58Module.default || bs58Module;

function buildNonce(walletAddress) {
  return `Login Solana Game :: ${walletAddress} :: ${Date.now()}`;
}

function verifyWalletSignature({ walletAddress, signature, signedMessage }) {
  const messageBytes = new TextEncoder().encode(signedMessage);
  const signatureBytes = Uint8Array.from(Buffer.from(signature, "base64"));
  const publicKeyBytes = bs58.decode(walletAddress);

  return nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );
}

function buildSessionToken() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function buildSessionData(walletAddress) {
  return {
    walletAddress,
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  buildNonce,
  verifyWalletSignature,
  buildSessionToken,
  buildSessionData,
};