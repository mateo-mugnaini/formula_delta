import { applyMapDelta, applyObjectDelta, createInitialState } from '../../../packages/shared/src/index.js';
import { parseTopic } from './topic-parsers.js';

export function createIngestionPipeline({ onRawEvent = () => {}, onParsedUpdate = () => {}, initialState = createInitialState() } = {}) {
  let state = initialState;
  return {
    getState: () => state,
    process(rawEvent) {
      const event = { receivedAt: rawEvent.receivedAt ?? Date.now(), topic: rawEvent.topic, payload: rawEvent.payload };
      onRawEvent(event);
      const parsed = parseTopic(event.topic, event.payload);
      state = applyParsedUpdate(state, parsed);
      onParsedUpdate({ event, parsed, state });
      return parsed;
    }
  };
}

export function applyParsedUpdate(state, parsed) {
  switch (parsed.kind) {
    case 'session': return { ...state, session: applyObjectDelta(state.session, parsed.value) };
    case 'sessionStatus': return { ...state, session: applyObjectDelta(state.session, parsed.value) };
    case 'lapCount': return { ...state, session: applyObjectDelta(state.session, parsed.value) };
    case 'drivers': return { ...state, drivers: applyMapDelta(state.drivers, parsed.value) };
    case 'timing': return { ...state, timing: applyEntityMapDelta(state.timing, parsed.value) };
    case 'stints': return { ...state, stints: applyMapDelta(state.stints, parsed.value) };
    case 'track': return { ...state, track: applyObjectDelta(state.track, parsed.value) };
    case 'weather': return { ...state, weather: applyObjectDelta(state.weather, parsed.value) };
    case 'raceControl': return { ...state, raceControl: appendUniqueEvents(state.raceControl, parsed.value) };
    default: return state;
  }
}

function appendUniqueEvents(current, events) {
  const existing = new Set(current.map((event) => event.id));
  return [...current, ...events.filter((event) => !existing.has(event.id))];
}

function applyEntityMapDelta(current, delta) {
  const next = { ...(current || {}) };
  for (const [id, value] of Object.entries(delta || {})) {
    if (value === null) delete next[id];
    else next[id] = applyObjectDelta(next[id], value);
  }
  return next;
}
