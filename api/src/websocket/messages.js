export const messageTypes = Object.freeze({
  stateSnapshot: 'STATE_SNAPSHOT',
  stateUpdate: 'STATE_UPDATE',
  connectionStatus: 'CONNECTION_STATUS',
  error: 'ERROR'
});

export function createStateSnapshot(state, source = { mode: 'unknown' }) {
  return { type: messageTypes.stateSnapshot, payload: { source, state } };
}

export function createStateUpdate(state, change = {}) {
  const key = change.kind === 'sessionStatus' || change.kind === 'lapCount' ? 'session' : change.kind;
  return { type: messageTypes.stateUpdate, payload: { change, value: state?.[key] ?? null } };
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
