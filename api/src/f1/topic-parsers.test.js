import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseTopic } from './topic-parsers.js';

async function fixture(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('parses verified session and driver topics', async () => {
  const session = await fixture('api/fixtures/session/observed-spanish-gp-session-info.json');
  const drivers = await fixture('api/fixtures/driver-list/observed-spanish-gp-drivers.json');

  assert.equal(parseTopic('SessionInfo', session.SessionInfo).value.type, 'Race');
  assert.equal(Object.keys(parseTopic('DriverList', drivers.DriverList).value).length, 3);
});

test('parses timing, stints, weather, and Race Control topics', async () => {
  const timing = await fixture('api/fixtures/timing-data/observed-spanish-gp-timing.json');
  const stints = await fixture('api/fixtures/timing-app-data/observed-spanish-gp-tyres.json');
  const weather = await fixture('api/fixtures/weather/observed-spanish-gp-weather.json');
  const raceControl = await fixture(
    'api/fixtures/race-control/observed-spanish-gp-race-control.json',
  );

  assert.equal(parseTopic('TimingData', timing.TimingData).value['3'].position, 2);
  assert.equal(parseTopic('TimingAppData', stints.TimingAppData).value['12'].length, 2);
  assert.equal(parseTopic('WeatherData', weather.WeatherData).value.airTemperature, 31.4);
  assert.equal(parseTopic('RaceControlMessages', raceControl.RaceControlMessages).value.length, 3);
});

test('preserves unknown topics without throwing', () => {
  const result = parseTopic('FutureTopic', { Value: 1 });
  assert.equal(result.kind, 'unknown');
  assert.deepEqual(result.value, { Value: 1 });
});
