const connectWalletBtn = document.getElementById("connectWalletBtn");
const disconnectWalletBtn = document.getElementById("disconnectWalletBtn");

const MANUAL_LOGOUT_KEY = "solRunnerManualLogout";

let provider = null;
let connectedWallet = localStorage.getItem("walletAddress") || null;
let sessionToken = localStorage.getItem("sessionToken") || null;
let walletEventsBound = false;
let isManualDisconnectInProgress = false;

function notify(type, message, duration = 3200) {
  if (window.solRunnerNotify && typeof window.solRunnerNotify[type] === "function") {
    window.solRunnerNotify[type](message, duration);
    return;
  }

  console[type === "error" ? "error" : "log"](message);
}

function getProvider() {
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
  if (window.solana?.isPhantom) return window.solana;
  return null;
}

function getSolanaWeb3() {
  if (!window.solanaWeb3) {
    throw new Error("solanaWeb3 no está disponible en el frontend.");
  }
  return window.solanaWeb3;
}

function getRpcUrlByNetwork(network) {
  switch ((network || "").toLowerCase()) {
    case "devnet":
      return "https://api.devnet.solana.com";
    case "testnet":
      return "https://api.testnet.solana.com";
    case "mainnet":
    case "mainnet-beta":
      return "https://api.mainnet-beta.solana.com";
    default:
      return "https://api.devnet.solana.com";
  }
}

function uint8ArrayToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function saveWalletAddress(address) {
  connectedWallet = address || null;

  if (connectedWallet) {
    localStorage.setItem("walletAddress", connectedWallet);
  } else {
    localStorage.removeItem("walletAddress");
  }
}

function saveSessionToken(token) {
  sessionToken = token || null;

  if (sessionToken) {
    localStorage.setItem("sessionToken", sessionToken);
  } else {
    localStorage.removeItem("sessionToken");
  }
}

function isAuthenticated() {
  return Boolean(sessionToken && connectedWallet);
}

function getAuthSnapshot() {
  return {
    connectedWallet,
    sessionToken,
    authenticated: isAuthenticated(),
  };
}

function refreshUiFromModules() {
  try {
    window.solRunnerLoginScreen?.refreshLoginScreen?.();
  } catch (error) {
    console.error("Error refrescando login screen:", error);
  }

  try {
    window.solRunnerMenuScreen?.refreshMenuAuth?.();
  } catch (error) {
    console.error("Error refrescando menu screen:", error);
  }
}

function emitAuthStateChanged() {
  refreshUiFromModules();

  window.dispatchEvent(
    new CustomEvent("solrunner:auth-changed", {
      detail: getAuthSnapshot(),
    })
  );
}

function clearSessionOnly() {
  saveSessionToken(null);
  emitAuthStateChanged();
}

function clearAllWalletState() {
  saveWalletAddress(null);
  saveSessionToken(null);
  emitAuthStateChanged();
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const raw = await response.text();

  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (response.status === 401) {
    clearSessionOnly();
    throw new Error(data?.message || "Sesión inválida");
  }

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || `Error en ${url}`);
  }

  return data;
}

async function signInWithWallet() {
  provider = getProvider();

  if (!provider || !connectedWallet) {
    throw new Error("No hay wallet conectada.");
  }

  const nonceData = await fetchJson("/auth/nonce", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      walletAddress: connectedWallet,
    }),
  });

  const message = nonceData.nonce;
  if (!message) {
    throw new Error("No se recibió nonce para autenticar.");
  }

  const encodedMessage = new TextEncoder().encode(message);
  const signed = await provider.signMessage(encodedMessage, "utf8");
  const signatureBase64 = uint8ArrayToBase64(signed.signature);

  const verifyData = await fetchJson("/auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      walletAddress: connectedWallet,
      signature: signatureBase64,
      signedMessage: message,
    }),
  });

  if (!verifyData?.sessionToken) {
    throw new Error("No se recibió sessionToken del backend.");
  }

  saveSessionToken(verifyData.sessionToken);
  sessionStorage.removeItem(MANUAL_LOGOUT_KEY);
  emitAuthStateChanged();

  console.log("Sesión autenticada:", verifyData);
  return verifyData;
}

async function connectWallet() {
  try {
    provider = getProvider();

    if (!provider) {
      notify("error", "Phantom no está instalado.");
      return;
    }

    sessionStorage.removeItem(MANUAL_LOGOUT_KEY);

    const resp = await provider.connect();
    const publicKey = resp?.publicKey?.toString();

    if (!publicKey) {
      throw new Error("No se pudo obtener la dirección de la wallet.");
    }

    saveWalletAddress(publicKey);
    emitAuthStateChanged();

    await signInWithWallet();
    notify("success", "Wallet conectada y autenticada correctamente.");
  } catch (error) {
    console.error("Error conectando/autenticando:", error);
    clearAllWalletState();
    notify("error", error.message || "No se pudo conectar y autenticar la wallet.");
  }
}

async function disconnectWallet() {
  try {
    isManualDisconnectInProgress = true;
    sessionStorage.setItem(MANUAL_LOGOUT_KEY, "1");

    provider = getProvider();

    clearAllWalletState();

    if (provider?.isConnected) {
      await provider.disconnect();
    }

    notify("info", "Sesión cerrada correctamente.");
  } catch (error) {
    console.error("Error desconectando:", error);
    notify("error", "No se pudo cerrar la sesión correctamente.");
  } finally {
    clearAllWalletState();
    isManualDisconnectInProgress = false;
  }
}

async function getEntryPaymentConfig(floor = 1) {
  const data = await fetchJson(`/payments/entry/${Number(floor) || 1}`, {
    method: "GET",
  });

  return data.data;
}

async function sendEntryPayment(paymentConfig) {
  provider = getProvider();

  if (!provider || !provider.publicKey) {
    throw new Error("La wallet no está conectada.");
  }

  const { Connection, PublicKey, Transaction, SystemProgram } = getSolanaWeb3();

  const rpcUrl = getRpcUrlByNetwork(paymentConfig.network);
  const connection = new Connection(rpcUrl, "confirmed");

  const fromPubkey = provider.publicKey;
  const toPubkey = new PublicKey(paymentConfig.treasuryWallet);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: paymentConfig.entryFeeLamports,
    })
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  const txResult = await provider.signAndSendTransaction(transaction);
  const txSignature =
    typeof txResult === "string" ? txResult : txResult?.signature;

  if (!txSignature) {
    throw new Error("No se pudo obtener la firma de la transacción.");
  }

  await connection.confirmTransaction(
    {
      signature: txSignature,
      blockhash,
      lastValidBlockHeight,
    },
    "confirmed"
  );

  return txSignature;
}

async function verifyEntryPayment(floor, txSignature) {
  const data = await fetchJson("/payments/verify-entry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      walletAddress: connectedWallet,
      floor,
      txSignature,
    }),
  });

  return data.data;
}

async function startRunRequest(floor, txSignature) {
  if (!sessionToken) {
    throw new Error("No hay sesión autenticada.");
  }

  const data = await fetchJson("/run/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionToken,
      floor,
      txSignature,
    }),
  });

  return data.run;
}

async function ensureFreshSessionBeforePlay() {
  if (!connectedWallet) {
    throw new Error("Primero conecta tu wallet.");
  }

  provider = getProvider();

  if (!provider || !provider.publicKey) {
    throw new Error("La wallet no está disponible.");
  }

  const currentProviderWallet = provider.publicKey.toString();

  if (connectedWallet !== currentProviderWallet) {
    saveWalletAddress(currentProviderWallet);
    clearSessionOnly();
  }

  if (!sessionToken) {
    await signInWithWallet();
  }
}

async function startPaidRun(floor = 1) {
  provider = getProvider();

  if (!provider || !provider.publicKey || !connectedWallet) {
    throw new Error("Primero conecta tu wallet.");
  }

  const safeFloor = Math.max(1, Number(floor) || 1);

  await ensureFreshSessionBeforePlay();

  const paymentConfig = await getEntryPaymentConfig(safeFloor);
  const txSignature = await sendEntryPayment(paymentConfig);
  const paymentVerification = await verifyEntryPayment(safeFloor, txSignature);
  const run = await startRunRequest(safeFloor, txSignature);

  const result = {
    floor: safeFloor,
    paymentConfig,
    paymentVerification,
    txSignature,
    run,
  };

  console.log("Run pagada e iniciada:", result);
  return result;
}

function getSessionToken() {
  return sessionToken;
}

function getConnectedWallet() {
  return connectedWallet;
}

async function hydrateWalletState() {
  provider = getProvider();

  if (!provider) {
    clearAllWalletState();
    return;
  }

  if (sessionStorage.getItem(MANUAL_LOGOUT_KEY) === "1") {
    try {
      if (provider.isConnected) {
        await provider.disconnect();
      }
    } catch (error) {
      console.error("Error forzando logout limpio:", error);
    }

    clearAllWalletState();
    return;
  }

  try {
    if (provider.isConnected && provider.publicKey) {
      saveWalletAddress(provider.publicKey.toString());
    } else {
      saveWalletAddress(null);
    }
  } catch (error) {
    console.error("Error leyendo estado inicial de Phantom:", error);
    saveWalletAddress(null);
  }

  emitAuthStateChanged();
}

function bindProviderEvents() {
  if (!provider || walletEventsBound) return;

  provider.on("connect", (publicKey) => {
    if (isManualDisconnectInProgress) return;

    const wallet = publicKey?.toString?.() || null;
    saveWalletAddress(wallet);
    emitAuthStateChanged();
  });

  provider.on("disconnect", () => {
    clearAllWalletState();
  });

  walletEventsBound = true;
}

window.solRunnerWallet = {
  connectWallet,
  disconnectWallet,
  signInWithWallet,
  startPaidRun,
  getSessionToken,
  getConnectedWallet,
  isAuthenticated,
  hydrateWalletState,
  getAuthSnapshot,
  emitAuthStateChanged,
};

window.addEventListener("load", async () => {
  provider = getProvider();
  bindProviderEvents();
  await hydrateWalletState();
});

if (connectWalletBtn) {
  connectWalletBtn.addEventListener("click", connectWallet);
}

if (disconnectWalletBtn) {
  disconnectWalletBtn.addEventListener("click", disconnectWallet);
}

const menuDisconnectBtn = document.getElementById("menuDisconnectBtn");
if (menuDisconnectBtn) {
  menuDisconnectBtn.addEventListener("click", disconnectWallet);
}

emitAuthStateChanged();