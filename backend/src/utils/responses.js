function okResponse(message, data = null, extra = {}) {
  return {
    ok: true,
    message,
    ...(data !== null ? { data } : {}),
    ...extra,
  };
}

function errorResponse(message, error = null, extra = {}) {
  return {
    ok: false,
    message,
    ...(error ? { error } : {}),
    ...extra,
  };
}

function serviceResult(status, body) {
  return {
    status,
    body,
  };
}

module.exports = {
  okResponse,
  errorResponse,
  serviceResult,
};