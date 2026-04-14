function format(scope, level, message, meta) {
  const time = new Date().toISOString();
  const base = `[${time}] [${level}]${scope ? ` [${scope}]` : ""} ${message}`;

  if (meta === undefined || meta === null) {
    return base;
  }

  try {
    return `${base} ${JSON.stringify(meta)}`;
  } catch {
    return `${base} ${String(meta)}`;
  }
}

function info(message, meta, scope = "") {
  console.log(format(scope, "INFO", message, meta));
}

function warn(message, meta, scope = "") {
  console.warn(format(scope, "WARN", message, meta));
}

function error(message, meta, scope = "") {
  console.error(format(scope, "ERROR", message, meta));
}

module.exports = {
  info,
  warn,
  error,
};