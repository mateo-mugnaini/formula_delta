import test from 'node:test';
import assert from 'node:assert/strict';
import { createReplaySource } from './replay-source.js';

test('replays ordered events and reaches completed state', async () => {
  const received = [];
  const source = createReplaySource({
    events: [
      { sequence: 1, elapsedMs: 0, topic: 'SessionInfo', payload: { Key: 1 } },
      { sequence: 2, elapsedMs: 5, topic: 'TimingData', payload: { Lines: {} } }
    ],
    onEvent: (event) => received.push(event)
  });

  source.play();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(received.map((event) => event.topic), ['SessionInfo', 'TimingData']);
  assert.equal(source.getState().status, 'completed');
});

test('supports pause, restart, and validated playback speed', () => {
  const source = createReplaySource({ events: [{ sequence: 1, elapsedMs: 100, topic: 'TimingData', payload: {} }] });
  source.setSpeed(2);
  assert.equal(source.getState().speed, 2);
  source.play();
  source.pause();
  assert.equal(source.getState().status, 'paused');
  source.restart();
  assert.equal(source.getState().status, 'idle');
  assert.throws(() => source.setSpeed(3), /Unsupported replay speed/);
});
