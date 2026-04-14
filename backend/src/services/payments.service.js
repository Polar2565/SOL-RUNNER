const { PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const { connection, getRewardWallet, RPC_URL } = require("../config/solana");
const { getEntryFeeForFloor } = require("./economy.service");

const bs58Module = require("bs58");
const bs58 = bs58Module.default || bs58Module;

function getNetworkFromRpcUrl(rpcUrl = "") {
  const value = String(rpcUrl || "").toLowerCase();

  if (value.includes("mainnet")) return "mainnet-beta";
  if (value.includes("testnet")) return "testnet";
  if (value.includes("devnet")) return "devnet";

  return "devnet";
}

function getSafeFloor(floor) {
  return Math.max(1, Number(floor) || 1);
}

function getEntryPaymentConfig(floor) {
  const safeFloor = getSafeFloor(floor);
  const entryFeeSol = getEntryFeeForFloor(safeFloor);
  const entryFeeLamports = Math.floor(entryFeeSol * LAMPORTS_PER_SOL);
  const treasuryWallet = getRewardWallet().publicKey.toBase58();
  const network = getNetworkFromRpcUrl(RPC_URL || connection?.rpcEndpoint);

  return {
    floor: safeFloor,
    currency: "SOL",
    network,
    entryFeeSol,
    entryFeeLamports,
    treasuryWallet,
  };
}

function isValidBase58(value) {
  try {
    const decoded = bs58.decode(value);
    return decoded && decoded.length > 0;
  } catch {
    return false;
  }
}

function isValidPublicKey(value) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

async function verifyEntryPayment({ walletAddress, floor, txSignature }) {
  if (!walletAddress || typeof walletAddress !== "string") {
    return {
      status: 400,
      body: {
        ok: false,
        message: "walletAddress es requerido",
      },
    };
  }

  if (!txSignature || typeof txSignature !== "string") {
    return {
      status: 400,
      body: {
        ok: false,
        message: "txSignature es requerido",
      },
    };
  }

  const cleanWallet = walletAddress.trim();
  const cleanSignature = txSignature.trim();

  if (!isValidPublicKey(cleanWallet)) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "walletAddress inválida",
      },
    };
  }

  if (!isValidBase58(cleanSignature)) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "txSignature inválida",
      },
    };
  }

  const config = getEntryPaymentConfig(floor);
  const treasuryWallet = config.treasuryWallet;

  let parsedTx;

  try {
    parsedTx = await connection.getParsedTransaction(cleanSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
  } catch (error) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "txSignature inválida o mal formada",
        error: error.message,
      },
    };
  }

  if (!parsedTx) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "Transacción no encontrada o no confirmada",
      },
    };
  }

  const instructions = parsedTx.transaction?.message?.instructions || [];

  const transferInstruction = instructions.find((ix) => {
    const parsed = ix?.parsed;

    return (
      parsed &&
      parsed.type === "transfer" &&
      parsed.info &&
      parsed.info.source === cleanWallet &&
      parsed.info.destination === treasuryWallet
    );
  });

  if (!transferInstruction) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "La transacción no contiene un pago válido hacia la treasury wallet",
        expectedTreasuryWallet: treasuryWallet,
      },
    };
  }

  const paidLamports = Number(transferInstruction.parsed.info.lamports || 0);

  if (paidLamports < config.entryFeeLamports) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El monto pagado es menor al requerido",
        expectedLamports: config.entryFeeLamports,
        paidLamports,
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: "Pago de entrada verificado correctamente",
      data: {
        walletAddress: cleanWallet,
        floor: config.floor,
        txSignature: cleanSignature,
        treasuryWallet,
        expectedLamports: config.entryFeeLamports,
        paidLamports,
        entryFeeSol: config.entryFeeSol,
        network: config.network,
      },
    },
  };
}

module.exports = {
  getEntryPaymentConfig,
  verifyEntryPayment,
};