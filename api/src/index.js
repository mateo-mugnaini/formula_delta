import { createBackendApp } from './app.js';

const host = process.env.FORMULA_DELTA_HOST || '127.0.0.1';
const port = Number(process.env.FORMULA_DELTA_PORT || 3000);
const app = createBackendApp({ host, port });

await app.start();
console.log(`Formula Delta backend listening on http://${host}:${port}`);

process.once('SIGINT', () => void app.stop().then(() => process.exit(0)));
process.once('SIGTERM', () => void app.stop().then(() => process.exit(0)));
