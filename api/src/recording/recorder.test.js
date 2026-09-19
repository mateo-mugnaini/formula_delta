import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRecorder } from './recorder.js';

test('records raw events as ordered JSONL and completes metadata', async () => {
  const root = await mkdtemp(join(tmpdir(), 'formula-delta-recorder-'));
  try {
    const recorder = await createRecorder({
      rootDir: root,
      recordingId: 'sample',
      metadata: { source: 'test' },
    });
    const receivedAt = Date.now();
    const first = await recorder.record({
      receivedAt,
      topic: 'TimingData',
      payload: { Lines: {} },
    });
    const second = await recorder.record({
      receivedAt: receivedAt + 15,
      topic: 'WeatherData',
      payload: { AirTemp: '31.4' },
    });
    await recorder.stop();

    assert.equal(first.sequence, 1);
    assert.ok(second.elapsedMs >= 15);
    const lines = (await readFile(join(root, 'sample', 'events.jsonl'), 'utf8'))
      .trim()
      .split('\n')
      .map(JSON.parse);
    const metadata = JSON.parse(await readFile(join(root, 'sample', 'metadata.json'), 'utf8'));
    assert.equal(lines.length, 2);
    assert.equal(lines[1].topic, 'WeatherData');
    assert.equal(metadata.status, 'complete');
    assert.equal(metadata.eventCount, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rejects events after stopping', async () => {
  const root = await mkdtemp(join(tmpdir(), 'formula-delta-recorder-'));
  try {
    const recorder = await createRecorder({ rootDir: root, recordingId: 'sample' });
    await recorder.stop();
    await assert.rejects(
      () => recorder.record({ topic: 'TimingData', payload: {} }),
      /after recorder stop/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('does not advance the sequence when an event cannot be serialized', async () => {
  const root = await mkdtemp(join(tmpdir(), 'formula-delta-recorder-'));
  const errors = [];
  try {
    const recorder = await createRecorder({
      rootDir: root,
      recordingId: 'failed',
      onError: (error) => errors.push(error),
    });
    const circular = {};
    circular.self = circular;

    await assert.rejects(
      () => recorder.record({ topic: 'TimingData', payload: circular }),
      /circular structure|JSON/i,
    );
    const metadata = JSON.parse(await readFile(join(root, 'failed', 'metadata.json'), 'utf8'));
    assert.equal(metadata.status, 'failed');
    assert.equal(metadata.eventCount, 0);
    assert.equal(errors.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
