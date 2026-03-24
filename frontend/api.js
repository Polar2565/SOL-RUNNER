const API = (() => {
  async function request(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || `Error HTTP ${response.status}`);
    }

    return data;
  }

  function post(url, body = {}) {
    return request(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  function get(url) {
    return request(url, {
      method: "GET",
    });
  }

  return {
    health() {
      return get("/health");
    },

    authNonce(walletAddress) {
      return post("/auth/nonce", { walletAddress });
    },

    authVerify(walletAddress, signature, signedMessage) {
      return post("/auth/verify", {
        walletAddress,
        signature,
        signedMessage,
      });
    },

    runComplete(sessionToken, payload = {}) {
      return post("/run/complete", {
        sessionToken,
        ...payload,
      });
    },

    rewardClaim(sessionToken) {
      return post("/reward/claim", { sessionToken });
    },
  };
})();

window.API = API;