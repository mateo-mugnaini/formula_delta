import { createBackendApp } from './app.js';
import { loadRecording, createReplaySource } from './replay/replay-source.js';
import { createLiveSource } from './f1/live-source.js';
import { createLogger } from './observability/logger.js';
import { createRaceControlCatalog } from './f1/race-control-catalog.js';

const host = process.env.FORMULA_DELTA_HOST || '127.0.0.1';
const port = Number(process.env.FORMULA_DELTA_PORT || 3000);
let processReplayEvent;
let source = null;
const logger = createLogger();
const raceControlCatalog = await createRaceControlCatalog({ filePath: process.env.FORMULA_DELTA_RACE_CONTROL_CATALOG || 'output/race-control-glossary.json' });
if (process.env.FORMULA_DELTA_REPLAY_DIR) {
  const events = await loadRecording(process.env.FORMULA_DELTA_REPLAY_DIR, {
    onWarning: ({ type, line }) =>
      console.warn(`Replay recording warning: ${type} at JSONL line ${line}.`),
  });
  source = createReplaySource({ events, onEvent: (event) => processReplayEvent?.(event) });
} else if (process.env.F1_SIGNALR_URL && process.env.F1_SIGNALR_TOPICS) {
  const topics = process.env.F1_SIGNALR_TOPICS.split(',').map((topic) => topic.trim()).filter(Boolean);
  const mapTopics = topics.filter((topic) => /(position|cardata)/i.test(topic));
  logger.info('Map data topic configuration', {
    requestedTopics: mapTopics,
    mapTopicsConfigured: mapTopics.length > 0,
    expectedTopics: ['Position.z', 'CarData.z'],
  });
  if (mapTopics.length === 0) {
    logger.warn('Map data is disabled: F1_SIGNALR_TOPICS does not include Position.z or CarData.z', {
      configuredTopics: topics,
      hint: 'Add Position.z,CarData.z to F1_SIGNALR_TOPICS and restart the backend',
    });
  }
  source = createLiveSource({
    url: process.env.F1_SIGNALR_URL,
    topics,
    onEvent: (event) => processReplayEvent?.(event),
    onStatus: (status) => logger.info('F1 live source status', status),
    onError: (error) => logger.error('F1 live source error', {
      message: error?.message,
      cause: error?.cause?.message || error?.cause?.code,
    }),
  });
  logger.info('F1 live source configured', { url: process.env.F1_SIGNALR_URL, topics: topics.length });
} else {
  logger.warn('No data source configured; API will serve an empty state', {
    replay: Boolean(process.env.FORMULA_DELTA_REPLAY_DIR),
    liveUrl: Boolean(process.env.F1_SIGNALR_URL),
    liveTopics: Boolean(process.env.F1_SIGNALR_TOPICS),
  });
}
const app = createBackendApp({
  host,
  port,
  source,
  logger,
  onRaceControl: (events) => void raceControlCatalog.record(events),
  onStatus: (status) => {
    if (status.type !== 'state-update') logger.info('Backend status', status);
  },
});
processReplayEvent = (event) => app.pipeline.process(event);

try {
  await app.start();
  logger.info(`Formula Delta backend listening on http://${host}:${port}`);
  if (source?.mode === 'replay') {
    source.play();
    logger.info('Replay source loaded', { directory: process.env.FORMULA_DELTA_REPLAY_DIR });
  }
} catch (error) {
  logger.error('Unable to start Formula Delta backend', { message: error.message });
  process.exitCode = 1;
}

process.once('SIGINT', () => void app.stop().then(() => raceControlCatalog.close()).then(() => process.exit(0)));
process.once('SIGTERM', () => void app.stop().then(() => raceControlCatalog.close()).then(() => process.exit(0)));
