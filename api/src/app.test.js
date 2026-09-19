import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackendApp } from './app.js';

test('backend serves health and current normalized snapshot', async () => {
  const app = createBackendApp({ port: 0 });
  await app.start();
  const address = app.server.address();
  const baseUrl = `http://${address.address}:${address.port}`;
  try {
    const health = await fetch(`${baseUrl}/health`).then((response) => response.json());
    const snapshot = await fetch(`${baseUrl}/snapshot`).then((response) => response.json());
    assert.equal(health.status, 'ok');
    assert.deepEqual(snapshot.timing, {});
    assert.deepEqual(snapshot.drivers, {});
  } finally {
    await app.stop();
  }
});
