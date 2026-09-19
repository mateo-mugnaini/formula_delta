import test from 'node:test';
import assert from 'node:assert/strict';
import { protocolVersion } from '../packages/shared/src/index.js';
import { applyObjectDelta, applyMapDelta, parseGap, parseLapTime } from '../packages/shared/src/index.js';
import {
  normalizeDriver,
  normalizeDriverList,
  normalizeRaceControlMessages,
  normalizeStintLines,
  normalizeTimingEntry,
  normalizeTimingLines,
  normalizeWeather
} from '../packages/shared/src/index.js';
import { createCapabilities, isValidTimingEntry, validateCapabilities } from '../packages/shared/src/index.js';
import { readFile } from 'node:fs/promises';

test('shared protocol version is defined', () => {
  assert.equal(protocolVersion, 1);
});

test('parses observed timing values into stable primitives', () => {
  assert.deepEqual(parseGap('+4.351'), { type: 'time', milliseconds: 4351, display: '+4.351' });
  assert.deepEqual(parseGap('1L'), { type: 'laps', laps: 1, display: '1L' });
  assert.deepEqual(parseLapTime('1:36.030'), { milliseconds: 96030, display: '1:36.030' });
});

test('applies deltas without deleting absent state', () => {
  assert.deepEqual(applyObjectDelta({ position: 3, tyre: 'HARD' }, { position: 2 }), {
    position: 2,
    tyre: 'HARD'
  });
  assert.deepEqual(applyMapDelta({ '12': { position: 1 }, '3': { position: 2 } }, { '12': { position: 2 }, '3': null }), {
    '12': { position: 2 }
  });
});

test('normalizes observed driver, timing, and weather shapes', () => {
  assert.deepEqual(normalizeDriver('12', {
    RacingNumber: '12', Tla: 'ANT', FirstName: 'Kimi', LastName: 'Antonelli',
    FullName: 'Kimi ANTONELLI', TeamName: 'Mercedes', TeamColour: '00D7B6'
  }).team, { name: 'Mercedes', color: '00D7B6' });

  const timing = normalizeTimingEntry('3', {
    Position: '2', GapToLeader: '+4.351',
    IntervalToPositionAhead: { Value: '+4.351' },
    LastLapTime: { Value: '1:37.001' }, NumberOfLaps: 57, NumberOfPitStops: 1,
    Retired: false, InPit: false, PitOut: false, Stopped: false
  });
  assert.equal(timing.position, 2);
  assert.equal(timing.gapToLeader.milliseconds, 4351);
  assert.equal(timing.lastLap.milliseconds, 97001);
  assert.equal(normalizeWeather({ AirTemp: '31.4', Rainfall: '0' }).airTemperature, 31.4);
});

test('transforms observed fixture collections into domain collections', async () => {
  const drivers = JSON.parse(await readFile('api/fixtures/driver-list/observed-spanish-gp-drivers.json', 'utf8'));
  const timing = JSON.parse(await readFile('api/fixtures/timing-data/observed-spanish-gp-timing.json', 'utf8'));
  const stints = JSON.parse(await readFile('api/fixtures/timing-app-data/observed-spanish-gp-tyres.json', 'utf8'));
  const raceControl = JSON.parse(await readFile('api/fixtures/race-control/observed-spanish-gp-race-control.json', 'utf8'));

  assert.equal(Object.keys(normalizeDriverList(drivers.DriverList)).length, 3);
  assert.equal(normalizeTimingLines(timing.TimingData.Lines)['3'].position, 2);
  assert.equal(normalizeStintLines(stints.TimingAppData.Lines)['12'].length, 2);
  assert.equal(normalizeRaceControlMessages(raceControl.RaceControlMessages).length, 3);
});

test('validates normalized timing and capability contracts', () => {
  const validEntry = normalizeTimingEntry('12', { Position: '1', Retired: false });
  assert.equal(isValidTimingEntry(validEntry), true);
  assert.deepEqual(validateCapabilities(createCapabilities({ timing: true })), []);
  assert.deepEqual(validateCapabilities({ timing: 'yes' }), ['timing must be boolean']);
});
