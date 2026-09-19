export function validateTimingEntry(entry) {
  const errors = [];
  if (!entry || typeof entry !== 'object') return ['timing entry must be an object'];
  if (typeof entry.driverId !== 'string' || entry.driverId.length === 0) errors.push('driverId must be a non-empty string');
  if (entry.position !== undefined && entry.position !== null && !Number.isInteger(entry.position)) errors.push('position must be an integer or null');
  if (entry.lapCount !== undefined && entry.lapCount !== null && !Number.isInteger(entry.lapCount)) errors.push('lapCount must be an integer or null');
  if (!entry.status || typeof entry.status !== 'object') errors.push('status must be an object');
  return errors;
}

export function validateCapabilities(capabilities) {
  if (!capabilities || typeof capabilities !== 'object') return ['capabilities must be an object'];
  return Object.entries(capabilities)
    .filter(([, value]) => typeof value !== 'boolean')
    .map(([name]) => `${name} must be boolean`);
}

export function isValidTimingEntry(entry) {
  return validateTimingEntry(entry).length === 0;
}
