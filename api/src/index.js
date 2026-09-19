import { createBackendApp } from './app.js';

const host = process.env.FORMULA_DELTA_HOST || '127.0.0.1';
const port = Number(process.env.FORMULA_DELTA_PORT || 3000);
const app = createBackendApp({ host, port });

try {
  await app.start();
  console.log(`Formula Delta backend listening on http://${host}:${port}`);
} catch (error) {
  console.error(`Unable to start Formula Delta backend: ${error.message}`);
  process.exitCode = 1;
}

process.once('SIGINT', () => void app.stop().then(() => process.exit(0)));
process.once('SIGTERM', () => void app.stop().then(() => process.exit(0)));
