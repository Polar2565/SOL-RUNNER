const connectWalletBtn = document.getElementById("connectWalletBtn");
const disconnectWalletBtn = document.getElementById("disconnectWalletBtn");
const walletStatus = document.getElementById("walletStatus");
const walletAddress = document.getElementById("walletAddress");
const authStatus = document.getElementById("authStatus");

let provider = null;
let connectedWallet = null;
let sessionToken = localStorage.getItem("sessionToken") || null;

function getProvider() {
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
  if (window.solana?.isPhantom) return window.solana;
  return null;
}

function uint8ArrayToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function updateWalletUI() {
  if (connectedWallet) {
    walletStatus.textContent = "Conectada";
    walletAddress.textContent = connectedWallet;
    connectWalletBtn.disabled = true;
    disconnectWalletBtn.disabled = false;
  } else {
    walletStatus.textContent = "No conectada";
    walletAddress.textContent = "-";
    connectWalletBtn.disabled = false;
    disconnectWalletBtn.disabled = true;
  }

  authStatus.textContent = sessionToken ? "Autenticada" : "No autenticada";
  const startGameBtn = document.getElementById("startGameBtn");
if (startGameBtn) {
  startGameBtn.disabled = !sessionToken;
}
}

async function signInWithWallet() {
  if (!provider || !connectedWallet) {
    throw new Error("No hay wallet conectada");
  }

  // 1. pedir nonce
  const nonceRes = await fetch("/auth/nonce", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      walletAddress: connectedWallet,
    }),
  });

  const nonceData = await nonceRes.json();

  if (!nonceRes.ok || !nonceData.ok) {
    throw new Error(nonceData.message || "No se pudo obtener el nonce");
  }

  const message = nonceData.nonce;
  const encodedMessage = new TextEncoder().encode(message);

  // 2. firmar mensaje
  const signed = await provider.signMessage(encodedMessage, "utf8");
  const signatureBase64 = uint8ArrayToBase64(signed.signature);

  // 3. verificar firma en backend
  const verifyRes = await fetch("/auth/verify", {
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

  const verifyData = await verifyRes.json();

  if (!verifyRes.ok || !verifyData.ok) {
    throw new Error(verifyData.message || "No se pudo verificar la firma");
  }

  sessionToken = verifyData.sessionToken;
  localStorage.setItem("sessionToken", sessionToken);
  localStorage.setItem("walletAddress", connectedWallet);

  updateWalletUI();
  console.log("Sesión autenticada:", verifyData);
}

async function connectWallet() {
  try {
    provider = getProvider();

    if (!provider) {
      alert("Phantom no está instalado.");
      return;
    }

    const resp = await provider.connect();
    connectedWallet = resp.publicKey.toString();
    localStorage.setItem("walletAddress", connectedWallet);
    updateWalletUI();

    await signInWithWallet();
    alert("Wallet conectada y firma verificada.");
  } catch (error) {
    console.error("Error conectando/autenticando:", error);
    alert(error.message || "No se pudo conectar y autenticar la wallet.");
  }
}

async function disconnectWallet() {
  try {
    provider = getProvider();
    if (provider) {
      await provider.disconnect();
    }
  } catch (error) {
    console.error("Error desconectando:", error);
  }

  connectedWallet = null;
  sessionToken = null;
  localStorage.removeItem("walletAddress");
  localStorage.removeItem("sessionToken");
  updateWalletUI();
}

window.addEventListener("load", async () => {
  provider = getProvider();

  if (!provider) {
    updateWalletUI();
    return;
  }

  provider.on("connect", (publicKey) => {
    connectedWallet = publicKey.toString();
    localStorage.setItem("walletAddress", connectedWallet);
    updateWalletUI();
  });

  provider.on("disconnect", () => {
    connectedWallet = null;
    sessionToken = null;
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("sessionToken");
    updateWalletUI();
  });

  try {
    if (provider.isConnected && provider.publicKey) {
      connectedWallet = provider.publicKey.toString();
    }
  } catch (error) {
    console.error(error);
  }

  updateWalletUI();
});

connectWalletBtn.addEventListener("click", connectWallet);
disconnectWalletBtn.addEventListener("click", disconnectWallet);

updateWalletUI();