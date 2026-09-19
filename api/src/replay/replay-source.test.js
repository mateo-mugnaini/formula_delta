import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createReplaySource, loadRecording } from './replay-source.js';

test('replays ordered events and reaches completed state', async () => {
  const received = [];
  const source = createReplaySource({
    events: [
      { sequence: 1, elapsedMs: 0, topic: 'SessionInfo', payload: { Key: 1 } },
      { sequence: 2, elapsedMs: 5, topic: 'TimingData', payload: { Lines: {} } },
    ],
    onEvent: (event) => received.push(event),
  });

  source.play();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(
    received.map((event) => event.topic),
    ['SessionInfo', 'TimingData'],
  );
  assert.equal(source.getState().status, 'completed');
});

test('supports pause, restart, and validated playback speed', () => {
  const source = createReplaySource({
    events: [{ sequence: 1, elapsedMs: 100, topic: 'TimingData', payload: {} }],
  });
  source.setSpeed(2);
  assert.equal(source.getState().speed, 2);
  source.play();
  source.pause();
  assert.equal(source.getState().status, 'paused');
  source.restart();
  assert.equal(source.getState().status, 'idle');
  assert.throws(() => source.setSpeed(3), /Unsupported replay speed/);
});

test('loads valid events and ignores an incomplete final JSONL line', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'formula-delta-replay-'));
  const warnings = [];
  try {
    await writeFile(
      join(directory, 'events.jsonl'),
      '{"sequence":1,"elapsedMs":0,"topic":"TimingData","payload":{}}\n{"sequence":2',
    );
    const events = await loadRecording(directory, {
      onWarning: (warning) => warnings.push(warning),
    });
    assert.equal(events.length, 1);
    assert.equal(warnings[0].type, 'incomplete-final-line');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects malformed JSON in the middle of a recording', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'formula-delta-replay-'));
  try {
    await writeFile(join(directory, 'events.jsonl'), '{"sequence":1}\nnot-json\n{"sequence":3}\n');
    await assert.rejects(() => loadRecording(directory), /JSON/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('processes a long replay without retaining emitted event history', async () => {
  const eventCount = 100;
  const received = { count: 0 };
  const events = Array.from({ length: eventCount }, (_, index) => ({
    sequence: index + 1,
    elapsedMs: 0,
    topic: 'TimingData',
    payload: { Lines: {} },
  }));
  const source = createReplaySource({
    events,
    onEvent: () => {
      received.count += 1;
    },
  });

  source.play();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assert.equal(received.count, eventCount);
  assert.equal(source.getState().status, 'completed');
});
