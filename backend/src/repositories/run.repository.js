const pendingRuns = new Map();
const activeRuns = new Map();
const runHistory = new Map();
const usedEntryPayments = new Map();

function getPendingRun(runKey) {
  return pendingRuns.get(runKey) || null;
}

function setPendingRun(runKey, runData) {
  pendingRuns.set(runKey, runData);
  return runData;
}

function deletePendingRun(runKey) {
  return pendingRuns.delete(runKey);
}

function clearPendingRuns() {
  pendingRuns.clear();
}

function getAllPendingRuns() {
  return pendingRuns;
}

function getPendingRunsCount() {
  return pendingRuns.size;
}

function getActiveRun(runKey) {
  return activeRuns.get(runKey) || null;
}

function setActiveRun(runKey, runData) {
  activeRuns.set(runKey, runData);
  return runData;
}

function deleteActiveRun(runKey) {
  return activeRuns.delete(runKey);
}

function clearActiveRuns() {
  activeRuns.clear();
}

function getAllActiveRuns() {
  return activeRuns;
}

function getActiveRunsCount() {
  return activeRuns.size;
}

function getRunHistoryByKey(runKey) {
  return runHistory.get(runKey) || [];
}

function setRunHistoryByKey(runKey, history) {
  runHistory.set(runKey, history);
  return history;
}

function addRunHistoryItem(runKey, item) {
  const history = runHistory.get(runKey) || [];
  history.push(item);
  runHistory.set(runKey, history);
  return history;
}

function clearRunHistory() {
  runHistory.clear();
}

function getAllRunHistory() {
  return runHistory;
}

function isEntryPaymentUsed(txSignature) {
  return usedEntryPayments.has(txSignature);
}

function getUsedEntryPayment(txSignature) {
  return usedEntryPayments.get(txSignature) || null;
}

function setUsedEntryPayment(txSignature, paymentData) {
  usedEntryPayments.set(txSignature, paymentData);
  return paymentData;
}

function deleteUsedEntryPayment(txSignature) {
  return usedEntryPayments.delete(txSignature);
}

function clearUsedEntryPayments() {
  usedEntryPayments.clear();
}

function getAllUsedEntryPayments() {
  return usedEntryPayments;
}

function getUsedEntryPaymentsCount() {
  return usedEntryPayments.size;
}

module.exports = {
  getPendingRun,
  setPendingRun,
  deletePendingRun,
  clearPendingRuns,
  getAllPendingRuns,
  getPendingRunsCount,

  getActiveRun,
  setActiveRun,
  deleteActiveRun,
  clearActiveRuns,
  getAllActiveRuns,
  getActiveRunsCount,

  getRunHistoryByKey,
  setRunHistoryByKey,
  addRunHistoryItem,
  clearRunHistory,
  getAllRunHistory,

  isEntryPaymentUsed,
  getUsedEntryPayment,
  setUsedEntryPayment,
  deleteUsedEntryPayment,
  clearUsedEntryPayments,
  getAllUsedEntryPayments,
  getUsedEntryPaymentsCount,
};