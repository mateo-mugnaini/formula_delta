export const protocolVersion = 1;

export function createInitialClientState() {
  return {
    source: { mode: 'unknown' },
    session: {},
    drivers: {},
    timing: {},
    gapHistory: {},
    lapHistory: {},
    stints: {},
    track: {},
    raceControl: [],
    weather: {},
    capabilities: {},
    connection: {},
    replay: { status: 'idle', speed: 1, index: 0, total: 0 },
  };
}

export function applyServerMessage(state, message) {
  if (!message || message.protocolVersion !== protocolVersion) return state;
  if (message.type === 'STATE_SNAPSHOT') {
    const snapshot = message.payload?.state;
    if (!snapshot) return state;
    return { ...snapshot, source: message.payload.source ?? snapshot.source ?? state.source };
  }
  if (message.type === 'REPLAY_STATE') return { ...state, replay: message.payload ?? state.replay };
  if (message.type !== 'STATE_UPDATE') return state;
  const kind = message.payload?.change?.kind;
  const key = kind === 'sessionStatus' || kind === 'lapCount' ? 'session' : kind;
  if (!key || !(key in state)) return state;
  const nextState = { ...state, [key]: message.payload.value };
  if (kind !== 'timing') return nextState;
  const gapHistory = { ...state.gapHistory };
  const lapHistory = { ...state.lapHistory };
  for (const [driverId, timing] of Object.entries(message.payload.value || {})) {
    const gap = timing.gapToLeader?.milliseconds;
    if (gap != null) gapHistory[driverId] = [...(gapHistory[driverId] || []), gap].slice(-30);
    const lap = timing.lastLap?.milliseconds;
    if (lap != null) lapHistory[driverId] = [...(lapHistory[driverId] || []), lap].slice(-5);
  }
  return { ...nextState, gapHistory, lapHistory };
}
