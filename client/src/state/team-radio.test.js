import test from 'node:test';
import assert from 'node:assert/strict';
import { filterTeamRadioMessages, toggleRadioDriver } from './team-radio.js';

test('filters team radio messages by selected drivers', () => {
  const messages = [{ driverId: 12 }, { driverId: 10 }, { driverId: 1 }];
  assert.deepEqual(filterTeamRadioMessages(messages, [12, 10]), [messages[0], messages[1]]);
  assert.deepEqual(filterTeamRadioMessages(messages), messages);
});

test('toggles a driver in the radio selection', () => {
  assert.deepEqual(toggleRadioDriver([], 12), [12]);
  assert.deepEqual(toggleRadioDriver([12, 10], 12), [10]);
});
