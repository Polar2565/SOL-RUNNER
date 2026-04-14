function notFoundMiddleware(req, res, next) {
  return res.status(404).json({
    ok: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

function errorMiddleware(err, req, res, next) {
  console.error("UNHANDLED ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  const status = Number(err?.status) || 500;
  const message =
    err?.message || "Ocurrió un error interno en el servidor";

  return res.status(status).json({
    ok: false,
    message,
    error: process.env.NODE_ENV === "production" ? undefined : err?.stack,
  });
}

module.exports = {
  notFoundMiddleware,
  errorMiddleware,
};