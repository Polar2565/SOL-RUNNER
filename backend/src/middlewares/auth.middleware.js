const { getSession } = require("../repositories/session.repository");

function resolveSessionToken(req) {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  const headerToken =
    req.headers["x-session-token"] ||
    req.headers["x-sessiontoken"] ||
    req.headers["session-token"] ||
    "";

  const bodyToken = req.body?.sessionToken || "";
  const queryToken = req.query?.sessionToken || "";

  return String(
    bearerToken || headerToken || bodyToken || queryToken || ""
  ).trim();
}

function requireSession(req, res, next) {
  const sessionToken = resolveSessionToken(req);

  if (!sessionToken) {
    return res.status(401).json({
      ok: false,
      message: "sessionToken es requerido",
    });
  }

  const session = getSession(sessionToken);

  if (!session) {
    return res.status(401).json({
      ok: false,
      message: "Sesión inválida",
    });
  }

  req.sessionToken = sessionToken;
  req.sessionData = session;

  next();
}

function optionalSession(req, res, next) {
  const sessionToken = resolveSessionToken(req);

  if (!sessionToken) {
    req.sessionToken = null;
    req.sessionData = null;
    return next();
  }

  const session = getSession(sessionToken);

  req.sessionToken = sessionToken;
  req.sessionData = session || null;

  next();
}

module.exports = {
  resolveSessionToken,
  requireSession,
  optionalSession,
};