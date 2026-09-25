import {
  applyMapDelta,
  applyObjectDelta,
  createInitialState,
} from '../../../packages/shared/src/index.js';
import { parseTopic } from './topic-parsers.js';

export function createIngestionPipeline({
  onRawEvent = () => {},
  onParsedUpdate = () => {},
  onRaceControl = () => {},
  initialState = createInitialState(),
  logger = { debug() {} },
} = {}) {
  let state = initialState;
  let positionSampleLogged = false;
  return {
    getState: () => state,
    process(rawEvent) {
      const event = {
        receivedAt: rawEvent.receivedAt ?? Date.now(),
        topic: rawEvent.topic,
        payload: rawEvent.payload,
      };
      onRawEvent(event);
      if (!positionSampleLogged && /(position|cardata)/i.test(event.topic || '')) {
        positionSampleLogged = true;
        logger.info?.('Map data sample received', {
          topic: event.topic,
          payloadKeys: Object.keys(event.payload || {}).slice(0, 20),
          driverKeys: Object.keys(event.payload?.Lines || event.payload?.Entries || event.payload || {}).slice(0, 10),
          sample: summarizeMapPayload(event.payload),
        });
      }
      const parsed = parseTopic(event.topic, event.payload);
      if (parsed.kind === 'unknown') {
        logger.warn?.('Unknown F1 topic received', {
          topic: event.topic,
          payloadKeys: Object.keys(event.payload || {}).slice(0, 20),
        });
      }
      state = applyParsedUpdate(state, parsed);
      if (parsed.kind === 'raceControl') onRaceControl(parsed.value);
      onParsedUpdate({ event, parsed, state });
      return parsed;
    },
  };
}

function summarizeMapPayload(payload) {
  if (!payload || typeof payload !== 'object') return { type: typeof payload, value: payload ?? null };
  const source = payload.Lines || payload.Entries || payload;
  const first = Object.entries(source).slice(0, 2);
  return first.map(([driverId, value]) => ({
    driverId,
    keys: value && typeof value === 'object' ? Object.keys(value).slice(0, 20) : [],
    value: value && typeof value !== 'object' ? value : undefined,
  }));
}

export function applyParsedUpdate(state, parsed) {
  switch (parsed.kind) {
    case 'session':
      return { ...state, session: applyObjectDelta(state.session, parsed.value) };
    case 'sessionStatus':
      return { ...state, session: applyObjectDelta(state.session, parsed.value) };
    case 'lapCount':
      return { ...state, session: applyObjectDelta(state.session, parsed.value) };
    case 'drivers':
      return { ...state, drivers: applyMapDelta(state.drivers, parsed.value) };
    case 'timing':
      return { ...state, timing: applyEntityMapDelta(state.timing, parsed.value) };
    case 'stints':
      return { ...state, stints: applyMapDelta(state.stints, parsed.value) };
    case 'track':
      return { ...state, track: applyObjectDelta(state.track, parsed.value) };
    case 'weather':
      return { ...state, weather: applyObjectDelta(state.weather, parsed.value) };
    case 'raceControl':
      return { ...state, raceControl: appendUniqueEvents(state.raceControl, parsed.value) };
    case 'teamRadio':
      return { ...state, teamRadio: appendUniqueEvents(state.teamRadio, parsed.value) };
    default:
      return state;
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
