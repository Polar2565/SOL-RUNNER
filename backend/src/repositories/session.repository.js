const nonces = new Map();
const sessions = new Map();

function getNonce(walletAddress) {
  return nonces.get(walletAddress) || null;
}

function setNonce(walletAddress, nonceData) {
  nonces.set(walletAddress, nonceData);
  return nonceData;
}

function deleteNonce(walletAddress) {
  return nonces.delete(walletAddress);
}

function clearNonces() {
  nonces.clear();
}

function getAllNonces() {
  return nonces;
}

function getSession(sessionToken) {
  return sessions.get(sessionToken) || null;
}

function setSession(sessionToken, sessionData) {
  sessions.set(sessionToken, sessionData);
  return sessionData;
}

function deleteSession(sessionToken) {
  return sessions.delete(sessionToken);
}

function clearSessions() {
  sessions.clear();
}

function getAllSessions() {
  return sessions;
}

function getSessionsCount() {
  return sessions.size;
}

function getNoncesCount() {
  return nonces.size;
}

module.exports = {
  getNonce,
  setNonce,
  deleteNonce,
  clearNonces,
  getAllNonces,
  getNoncesCount,

  getSession,
  setSession,
  deleteSession,
  clearSessions,
  getAllSessions,
  getSessionsCount,
};