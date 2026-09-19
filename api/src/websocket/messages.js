export const messageTypes = Object.freeze({
  stateSnapshot: 'STATE_SNAPSHOT',
  connectionStatus: 'CONNECTION_STATUS',
  error: 'ERROR'
});

export function createStateSnapshot(state, source = { mode: 'unknown' }) {
  return { type: messageTypes.stateSnapshot, payload: { source, state } };
}

export function createConnectionStatus(status, details = {}) {
  return { type: messageTypes.connectionStatus, payload: { status, ...details } };
}

export function createError(code, message) {
  return { type: messageTypes.error, payload: { code, message } };
}

export function serializeMessage(message) {
  return JSON.stringify(message);
}
