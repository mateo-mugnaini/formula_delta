import test from 'node:test';
import assert from 'node:assert/strict';
import { createIngestionPipeline } from '../f1/event-pipeline.js';
import { createReplaySource } from './replay-source.js';

const events = [
  {
    sequence: 1,
    elapsedMs: 0,
    topic: 'DriverList',
    payload: { 3: { RacingNumber: '3', Tla: 'VER', FullName: 'Max VERSTAPPEN' } },
  },
  {
    sequence: 2,
    elapsedMs: 0,
    topic: 'TimingData',
    payload: { Lines: { 3: { Position: '2', GapToLeader: '+4.351' } } },
  },
  {
    sequence: 3,
    elapsedMs: 5,
    topic: 'TimingData',
    payload: { Lines: { 3: { GapToLeader: '+4.100' } } },
  },
];

test('live and replay feed the same ingestion pipeline semantics', async () => {
  const livePipeline = createIngestionPipeline();
  for (const event of events) livePipeline.process(event);

  const replayPipeline = createIngestionPipeline();
  const replay = createReplaySource({ events, onEvent: (event) => replayPipeline.process(event) });
  replay.play();
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.deepEqual(replayPipeline.getState().drivers, livePipeline.getState().drivers);
  assert.deepEqual(replayPipeline.getState().timing, livePipeline.getState().timing);
});
