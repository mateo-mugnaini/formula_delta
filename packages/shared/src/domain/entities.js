import {
  normalizeBoolean,
  normalizeInteger,
  normalizeNumber,
  normalizeString,
  parseGap,
  parseLapTime
} from './primitives.js';

export function normalizeSession(raw = {}) {
  return {
    id: normalizeString(raw.Key),
    name: normalizeString(raw.Name),
    type: normalizeString(raw.Type),
    status: normalizeString(raw.SessionStatus),
    startDate: normalizeString(raw.StartDate),
    endDate: normalizeString(raw.EndDate),
    meeting: raw.Meeting ? {
      id: normalizeInteger(raw.Meeting.Key),
      name: normalizeString(raw.Meeting.Name),
      location: normalizeString(raw.Meeting.Location),
      circuit: raw.Meeting.Circuit ? {
        id: normalizeInteger(raw.Meeting.Circuit.Key),
        shortName: normalizeString(raw.Meeting.Circuit.ShortName)
      } : null
    } : null
  };
}

export function normalizeDriver(id, raw = {}) {
  return {
    id: String(id),
    racingNumber: normalizeString(raw.RacingNumber),
    abbreviation: normalizeString(raw.Tla),
    firstName: normalizeString(raw.FirstName),
    lastName: normalizeString(raw.LastName),
    fullName: normalizeString(raw.FullName),
    team: raw.TeamName ? {
      name: normalizeString(raw.TeamName),
      color: normalizeString(raw.TeamColour)
    } : null
  };
}

export function normalizeTimingEntry(driverId, raw = {}) {
  const entry = { driverId: String(driverId) };
  if (Object.hasOwn(raw, 'Position')) entry.position = normalizeInteger(raw.Position);
  if (Object.hasOwn(raw, 'GapToLeader')) entry.gapToLeader = parseGap(raw.GapToLeader);
  if (Object.hasOwn(raw, 'IntervalToPositionAhead')) entry.intervalToAhead = parseGap(raw.IntervalToPositionAhead?.Value);
  if (Object.hasOwn(raw, 'LastLapTime')) entry.lastLap = parseLapTime(raw.LastLapTime?.Value);
  if (Object.hasOwn(raw, 'BestLapTime')) entry.bestLap = parseLapTime(raw.BestLapTime?.Value);
  if (Object.hasOwn(raw, 'NumberOfLaps')) entry.lapCount = normalizeInteger(raw.NumberOfLaps);
  if (Object.hasOwn(raw, 'NumberOfPitStops')) entry.pitStops = normalizeInteger(raw.NumberOfPitStops);
  const status = {};
  for (const [source, target] of [['Retired', 'retired'], ['InPit', 'inPit'], ['PitOut', 'pitOut'], ['Stopped', 'stopped']]) {
    if (Object.hasOwn(raw, source)) status[target] = normalizeBoolean(raw[source]);
  }
  entry.status = status;
  if (Object.hasOwn(raw, 'Sectors')) entry.sectors = Array.isArray(raw.Sectors) ? raw.Sectors.map(normalizeSector) : [];
  return entry;
}

export function normalizeSector(raw = {}) {
  return {
    value: parseLapTime(raw.Value),
    stopped: normalizeBoolean(raw.Stopped),
    personalFastest: normalizeBoolean(raw.PersonalFastest),
    overallFastest: normalizeBoolean(raw.OverallFastest),
    segments: Array.isArray(raw.Segments) ? raw.Segments : []
  };
}

export function normalizeStint(driverId, raw = {}, index = 0) {
  return {
    id: `${driverId}:${index}`,
    driverId: String(driverId),
    number: index + 1,
    compound: normalizeString(raw.Compound)?.toUpperCase() || 'UNKNOWN',
    isNew: normalizeBoolean(raw.New),
    totalLaps: normalizeInteger(raw.TotalLaps),
    lapNumber: normalizeInteger(raw.LapNumber),
    lapTime: parseLapTime(raw.LapTime)
  };
}

export function normalizeWeather(raw = {}) {
  return {
    airTemperature: normalizeNumber(raw.AirTemp),
    trackTemperature: normalizeNumber(raw.TrackTemp),
    humidity: normalizeNumber(raw.Humidity),
    pressure: normalizeNumber(raw.Pressure),
    rainfall: normalizeNumber(raw.Rainfall),
    windSpeed: normalizeNumber(raw.WindSpeed),
    windDirection: normalizeNumber(raw.WindDirection)
  };
}

export function normalizeTrackState(raw = {}) {
  return {
    code: normalizeString(raw.Status),
    status: normalizeString(raw.Message),
    message: normalizeString(raw.Message)
  };
}

export function normalizeRaceControlEvent(raw = {}) {
  return {
    id: normalizeString(raw.Utc) + ':' + normalizeString(raw.Message),
    timestamp: normalizeString(raw.Utc),
    lap: normalizeInteger(raw.Lap),
    category: normalizeString(raw.Category),
    flag: normalizeString(raw.Flag),
    scope: normalizeString(raw.Scope),
    sector: normalizeInteger(raw.Sector),
    racingNumber: normalizeString(raw.RacingNumber),
    message: normalizeString(raw.Message)
  };
}

export function normalizeDriverList(raw = {}) {
  return Object.fromEntries(Object.entries(raw).map(([id, value]) => [id, normalizeDriver(id, value)]));
}

export function normalizeTimingLines(raw = {}) {
  return Object.fromEntries(Object.entries(raw).map(([id, value]) => [id, normalizeTimingEntry(id, value)]));
}

export function normalizeStintLines(raw = {}) {
  return Object.fromEntries(Object.entries(raw).map(([id, value]) => [
    id,
    Array.isArray(value?.Stints) ? value.Stints.map((stint, index) => normalizeStint(id, stint, index)) : []
  ]));
}

export function normalizeRaceControlMessages(raw = {}) {
  return Array.isArray(raw.Messages) ? raw.Messages.map(normalizeRaceControlEvent) : [];
}
