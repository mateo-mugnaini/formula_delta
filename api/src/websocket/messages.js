import { protocolVersion } from '../../../packages/shared/src/index.js';

export const messageTypes = Object.freeze({
  stateSnapshot: 'STATE_SNAPSHOT',
  stateUpdate: 'STATE_UPDATE',
  replayState: 'REPLAY_STATE',
  connectionStatus: 'CONNECTION_STATUS',
  error: 'ERROR'
});

export function createStateSnapshot(state, source = { mode: 'unknown' }) {
  return { type: messageTypes.stateSnapshot, protocolVersion, payload: { source, state } };
}

export function createStateUpdate(state, change = {}) {
  const key = change.kind === 'sessionStatus' || change.kind === 'lapCount' ? 'session' : change.kind;
  return { type: messageTypes.stateUpdate, protocolVersion, payload: { change, value: state?.[key] ?? null } };
}

export function createReplayState(state) {
  return { type: messageTypes.replayState, protocolVersion, payload: state };
}

export function createConnectionStatus(status, details = {}) {
  return { type: messageTypes.connectionStatus, protocolVersion, payload: { status, ...details } };
}

export function createError(code, message) {
  return { type: messageTypes.error, protocolVersion, payload: { code, message } };
}

export function serializeMessage(message) {
  return JSON.stringify(message);
}
