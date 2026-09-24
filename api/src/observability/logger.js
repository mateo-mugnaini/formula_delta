const levels = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };

export function createLogger({ level = process.env.FORMULA_DELTA_LOG_LEVEL || 'info', scope = 'api' } = {}) {
  const threshold = levels[level] ?? levels.info;
  return {
    error: (message, details) => write('error', message, details),
    warn: (message, details) => write('warn', message, details),
    info: (message, details) => write('info', message, details),
    debug: (message, details) => write('debug', message, details),
  };

  function write(name, message, details) {
    if (levels[name] > threshold) return;
    const suffix = details === undefined ? '' : ` ${safeJson(details)}`;
    console[name](`[${scope}] ${message}${suffix}`);
  }
}

function safeJson(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable-details]';
  }
}
