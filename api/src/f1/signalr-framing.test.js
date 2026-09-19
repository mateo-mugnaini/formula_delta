import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractTopicEvents,
  frameSignalRMessage,
  parseSignalRFrame,
  splitSignalRFrames,
} from './signalr-framing.js';

test('frames and splits SignalR JSON messages', () => {
  const raw = frameSignalRMessage({ type: 1, target: 'TimingData', arguments: [{ Lines: {} }] });
  assert.equal(splitSignalRFrames(raw).length, 1);
  assert.equal(parseSignalRFrame(splitSignalRFrames(raw)[0]).kind, 'invocation');
});

test('extracts multi-topic completion snapshots', () => {
  const parsed = parseSignalRFrame(
    JSON.stringify({
      type: 3,
      invocationId: '1',
      result: { SessionInfo: { Key: 1 }, TimingData: { Lines: {} } },
    }),
  );
  assert.deepEqual(extractTopicEvents(parsed), [
    { topic: 'SessionInfo', payload: { Key: 1 } },
    { topic: 'TimingData', payload: { Lines: {} } },
  ]);
});

test('classifies handshake, ping, close, and unknown frames', () => {
  assert.equal(parseSignalRFrame('{}').kind, 'handshake-ack');
  assert.equal(parseSignalRFrame(JSON.stringify({ type: 6 })).kind, 'ping');
  assert.equal(parseSignalRFrame(JSON.stringify({ type: 7 })).kind, 'close');
  assert.equal(parseSignalRFrame(JSON.stringify({ type: 99 })).kind, 'unknown');
});
