import test from 'node:test';
import assert from 'node:assert/strict';
import { createDelayBuffer } from './delay-buffer.js';

test('holds events until the configured presentation delay', () => {
  let clock = 1000;
  const emitted = [];
  const buffer = createDelayBuffer({ delayMs: 500, now: () => clock, onReady: (value) => emitted.push(value), setTimer: () => 1, clearTimer: () => {} });
  buffer.enqueue('first');
  assert.deepEqual(buffer.flush(1499), []);
  assert.deepEqual(buffer.flush(1500), ['first']);
  assert.deepEqual(emitted, ['first']);
});

test('preserves ordering and supports runtime delay changes', () => {
  const buffer = createDelayBuffer({ delayMs: 1000, now: () => 0, setTimer: () => 1, clearTimer: () => {} });
  buffer.enqueue('a', 0);
  buffer.enqueue('b', 100);
  buffer.setDelay(200);
  assert.deepEqual(buffer.flush(199), []);
  assert.deepEqual(buffer.flush(300), ['a', 'b']);
});

test('rejects invalid delays', () => {
  assert.throws(() => createDelayBuffer({ delayMs: -1 }), RangeError);
  assert.throws(() => createDelayBuffer({ delayMs: Infinity }), RangeError);
});
