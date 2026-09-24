import { createCapabilities } from './capabilities.js';

export function createInitialState() {
  return {
    session: null,
    drivers: {},
    timing: {},
    stints: {},
    track: null,
    raceControl: [],
    teamRadio: [],
    weather: null,
    capabilities: createCapabilities(),
    connection: { status: 'disconnected', source: null },
  };
}

export function applyObjectDelta(current, delta) {
  if (!delta || typeof delta !== 'object' || Array.isArray(delta)) return current;
  return { ...(current || {}), ...delta };
}

export function applyMapDelta(current, delta) {
  if (!delta || typeof delta !== 'object' || Array.isArray(delta)) return current;
  const next = { ...(current || {}) };
  for (const [key, value] of Object.entries(delta)) {
    if (value === null) delete next[key];
    else next[key] = value;
  }
  return next;
}
