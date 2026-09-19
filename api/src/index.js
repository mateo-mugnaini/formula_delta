import { createBackendApp } from './app.js';
import { loadRecording, createReplaySource } from './replay/replay-source.js';

const host = process.env.FORMULA_DELTA_HOST || '127.0.0.1';
const port = Number(process.env.FORMULA_DELTA_PORT || 3000);
let processReplayEvent;
let source = null;
if (process.env.FORMULA_DELTA_REPLAY_DIR) {
  const events = await loadRecording(process.env.FORMULA_DELTA_REPLAY_DIR, {
    onWarning: ({ type, line }) =>
      console.warn(`Replay recording warning: ${type} at JSONL line ${line}.`),
  });
  source = createReplaySource({ events, onEvent: (event) => processReplayEvent?.(event) });
}
const app = createBackendApp({ host, port, source });
processReplayEvent = (event) => app.pipeline.process(event);

try {
  await app.start();
  console.log(`Formula Delta backend listening on http://${host}:${port}`);
  if (source) {
    source.play();
    console.log(`Replay source loaded: ${process.env.FORMULA_DELTA_REPLAY_DIR}`);
  }
} catch (error) {
  console.error(`Unable to start Formula Delta backend: ${error.message}`);
  process.exitCode = 1;
}

process.once('SIGINT', () => void app.stop().then(() => process.exit(0)));
process.once('SIGTERM', () => void app.stop().then(() => process.exit(0)));
