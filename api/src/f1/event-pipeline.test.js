import test from 'node:test';
import assert from 'node:assert/strict';
import { createIngestionPipeline } from './event-pipeline.js';

test('preserves raw events and builds normalized state', () => {
  const rawEvents = [];
  const updates = [];
  const pipeline = createIngestionPipeline({ onRawEvent: (event) => rawEvents.push(event), onParsedUpdate: (update) => updates.push(update) });
  pipeline.process({ topic: 'TimingData', payload: { Lines: { '3': { Position: '2', GapToLeader: '+4.351' } } } });
  pipeline.process({ topic: 'TimingData', payload: { Lines: { '3': { GapToLeader: '+4.100' } } } });
  assert.equal(rawEvents.length, 2);
  assert.equal(updates.length, 2);
  assert.equal(pipeline.getState().timing['3'].position, 2);
  assert.equal(pipeline.getState().timing['3'].gapToLeader.milliseconds, 4100);
});

test('appends Race Control events without duplicating them', () => {
  const pipeline = createIngestionPipeline();
  const message = { Utc: '2026-09-13T14:38:28', Lap: 57, Category: 'Flag', Flag: 'CHEQUERED', Message: 'CHEQUERED FLAG' };
  pipeline.process({ topic: 'RaceControlMessages', payload: { Messages: [message] } });
  pipeline.process({ topic: 'RaceControlMessages', payload: { Messages: [message] } });
  assert.equal(pipeline.getState().raceControl.length, 1);
});

test('does not let unknown topics alter domain state', () => {
  const pipeline = createIngestionPipeline();
  const before = pipeline.getState();
  pipeline.process({ topic: 'FutureTopic', payload: { NewValue: true } });
  assert.deepEqual(pipeline.getState(), before);
});
