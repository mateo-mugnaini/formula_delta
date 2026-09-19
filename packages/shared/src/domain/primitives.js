export function normalizeString(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

export function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeInteger(value) {
  const number = normalizeNumber(value);
  return number === null ? null : Math.trunc(number);
}

export function normalizeBoolean(value) {
  if (value === true || value === false) return value;
  if (typeof value !== 'string') return null;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return null;
}

export function parseLapTime(value) {
  const display = normalizeString(value);
  if (!display) return null;

  const parts = display.split(':');
  const seconds = Number(parts.at(-1));
  const minutes = parts.length === 2 ? Number(parts[0]) : 0;
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;

  return {
    milliseconds: Math.round((minutes * 60 + seconds) * 1000),
    display
  };
}

export function parseGap(value) {
  const display = normalizeString(value);
  if (!display) return null;
  if (display.toUpperCase() === 'LEADER') return { type: 'leader', milliseconds: 0, display };

  const laps = display.match(/^([+-]?\d+)L$/i);
  if (laps) return { type: 'laps', laps: Number(laps[1]), display };

  const time = display.match(/^\+?(\d+(?:\.\d+)?)$/);
  if (!time) return { type: 'unknown', display };
  return { type: 'time', milliseconds: Math.round(Number(time[1]) * 1000), display };
}
