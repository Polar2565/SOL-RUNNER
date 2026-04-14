function toSafeString(value) {
  return String(value ?? "").trim();
}

function toSafeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function getSafeFloor(floor) {
  return Math.max(1, toSafeNumber(floor, 1));
}

function getSafeTxSignature(txSignature) {
  return toSafeString(txSignature);
}

function roundToDecimals(value, decimals = 4) {
  const factor = Math.pow(10, decimals);
  return Math.round((toSafeNumber(value) + Number.EPSILON) * factor) / factor;
}

function nowIso() {
  return new Date().toISOString();
}

function buildId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = {
  toSafeString,
  toSafeNumber,
  getSafeFloor,
  getSafeTxSignature,
  roundToDecimals,
  nowIso,
  buildId,
};