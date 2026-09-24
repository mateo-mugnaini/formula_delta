import {
  normalizeDriverList,
  normalizeRaceControlMessages,
  normalizeSession,
  normalizeStintLines,
  normalizeTimingLines,
  normalizeTrackState,
  normalizeTeamRadioMessages,
  normalizeWeather,
} from '../../../packages/shared/src/index.js';

export function parseTopic(topic, payload) {
  switch (topic) {
    case 'SessionInfo':
      return { kind: 'session', value: normalizeSession(payload) };
    case 'DriverList':
      return { kind: 'drivers', value: normalizeDriverList(payload) };
    case 'TimingData':
      return { kind: 'timing', value: normalizeTimingLines(payload?.Lines) };
    case 'TimingAppData':
      return { kind: 'stints', value: normalizeStintLines(payload?.Lines) };
    case 'TrackStatus':
      return { kind: 'track', value: normalizeTrackState(payload) };
    case 'RaceControlMessages':
      return { kind: 'raceControl', value: normalizeRaceControlMessages(payload) };
    case 'TeamRadio':
    case 'TeamRadioMessages':
      return { kind: 'teamRadio', value: normalizeTeamRadioMessages(payload) };
    case 'WeatherData':
      return { kind: 'weather', value: normalizeWeather(payload) };
    case 'SessionStatus':
      return { kind: 'sessionStatus', value: normalizeSessionStatus(payload) };
    case 'LapCount':
      return { kind: 'lapCount', value: normalizeLapCount(payload) };
    default:
      return { kind: 'unknown', topic, value: payload };
  }
}

function normalizeSessionStatus(raw = {}) {
  return {
    status: raw.Status ?? null,
    started: raw.Started ?? null,
  };
}

function normalizeLapCount(raw = {}) {
  return {
    currentLap: toInteger(raw.CurrentLap),
    totalLaps: toInteger(raw.TotalLaps),
  };
}

function toInteger(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : null;
}
