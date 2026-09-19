export const protocolVersion = 1;

export function createInitialClientState() {
  return { source: { mode: 'unknown' }, session: {}, drivers: {}, timing: {}, stints: {}, track: {}, raceControl: [], weather: {}, capabilities: {}, connection: {} };
}

export function applyServerMessage(state, message) {
  if (!message || message.protocolVersion !== protocolVersion) return state;
  if (message.type === 'STATE_SNAPSHOT') {
    const snapshot = message.payload?.state;
    if (!snapshot) return state;
    return { ...snapshot, source: message.payload.source ?? snapshot.source ?? state.source };
  }
  if (message.type !== 'STATE_UPDATE') return state;
  const kind = message.payload?.change?.kind;
  const key = kind === 'sessionStatus' || kind === 'lapCount' ? 'session' : kind;
  if (!key || !(key in state)) return state;
  return { ...state, [key]: message.payload.value };
}
