const {
  getAllNonces,
  getAllSessions,
  getSessionsCount,
} = require("../repositories/session.repository");

const {
  getAllPendingRuns,
  getAllActiveRuns,
  getAllRunHistory,
  getAllUsedEntryPayments,
  getPendingRunsCount,
  getActiveRunsCount,
  getUsedEntryPaymentsCount,
} = require("../repositories/run.repository");

function getNonces() {
  return getAllNonces();
}

function getSessions() {
  return getAllSessions();
}

function getPendingRuns() {
  return getAllPendingRuns();
}

function getActiveRuns() {
  return getAllActiveRuns();
}

function getRunHistory() {
  return getAllRunHistory();
}

function getUsedEntryPayments() {
  return getAllUsedEntryPayments();
}

module.exports = {
  getNonces,
  getSessions,
  getPendingRuns,
  getActiveRuns,
  getRunHistory,
  getUsedEntryPayments,
  getSessionsCount,
  getPendingRunsCount,
  getActiveRunsCount,
  getUsedEntryPaymentsCount,
};