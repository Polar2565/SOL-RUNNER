function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function requireBodyFields(fields = []) {
  return function validateRequiredFields(req, res, next) {
    const missing = fields.filter((field) => isEmpty(req.body?.[field]));

    if (missing.length > 0) {
      return res.status(400).json({
        ok: false,
        message: `Faltan campos requeridos: ${missing.join(", ")}`,
      });
    }

    next();
  };
}

function validateFloor(fieldName = "floor") {
  return function validateFloorMiddleware(req, res, next) {
    const rawValue =
      req.body?.[fieldName] ??
      req.params?.[fieldName] ??
      req.query?.[fieldName];

    const floor = Number(rawValue);

    if (!Number.isFinite(floor) || floor < 1) {
      return res.status(400).json({
        ok: false,
        message: `${fieldName} debe ser un número mayor o igual a 1`,
      });
    }

    next();
  };
}

function validateWalletAddress(fieldName = "walletAddress") {
  return function validateWalletAddressMiddleware(req, res, next) {
    const value =
      req.body?.[fieldName] ??
      req.params?.[fieldName] ??
      req.query?.[fieldName];

    if (isEmpty(value)) {
      return res.status(400).json({
        ok: false,
        message: `${fieldName} es requerido`,
      });
    }

    next();
  };
}

function validateTxSignature(fieldName = "txSignature") {
  return function validateTxSignatureMiddleware(req, res, next) {
    const value =
      req.body?.[fieldName] ??
      req.params?.[fieldName] ??
      req.query?.[fieldName];

    if (isEmpty(value)) {
      return res.status(400).json({
        ok: false,
        message: `${fieldName} es requerido`,
      });
    }

    next();
  };
}

module.exports = {
  requireBodyFields,
  validateFloor,
  validateWalletAddress,
  validateTxSignature,
};