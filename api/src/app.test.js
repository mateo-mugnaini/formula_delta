import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackendApp } from './app.js';
import { attachWebSocketTransport } from './websocket/transport.js';

test('backend serves health and current normalized snapshot', async () => {
  const app = createBackendApp({
    port: 0,
    webSocketTransportFactory: async () => ({ close() {} }),
  });
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

test('backend attaches WebSocket transport and broadcasts normalized snapshots', async () => {
  let connectionHandler;
  const client = {
    readyState: 1,
    messages: [],
    send(value) {
      this.messages.push(JSON.parse(value));
    },
    on(event, handler) {
      if (event === 'close') this.close = handler;
    },
  };
  const app = createBackendApp({
    port: 0,
    webSocketTransportFactory: async ({ httpServer, publisher }) =>
      attachWebSocketTransport({
        httpServer,
        publisher,
        webSocketServerFactory: () => ({
          on(event, handler) {
            if (event === 'connection') connectionHandler = handler;
          },
          close() {},
        }),
      }),
  });
  await app.start();
  try {
    connectionHandler(client);
    app.pipeline.process({
      topic: 'TimingData',
      payload: { Lines: { 1: { Position: '1', GapToLeader: '0' } } },
    });
    assert.equal(client.messages[0].type, 'STATE_SNAPSHOT');
    assert.equal(client.messages.at(-1).type, 'STATE_UPDATE');
    assert.equal(client.messages.at(-1).payload.change.kind, 'timing');
    assert.equal(client.messages.at(-1).payload.value['1'].position, 1);
    assert.equal(client.messages.at(-1).payload.value['1'].gapToLeader.milliseconds, 0);
  } finally {
    await app.stop();
  }
});

test('reports a readable error when the configured port is already in use', async () => {
  const occupied = createBackendApp({
    port: 0,
    webSocketTransportFactory: async () => ({ close() {} }),
  });
  await occupied.start();
  const port = occupied.server.address().port;
  const conflicting = createBackendApp({
    port,
    webSocketTransportFactory: async () => ({ close() {} }),
  });
  try {
    await assert.rejects(() => conflicting.start(), /Backend port is already in use/);
  } finally {
    await occupied.stop();
    await conflicting.stop();
  }
});

test('delays published updates and changes delay through sync commands', async () => {
  let connectionHandler;
  let messageHandler;
  const messages = [];
  const app = createBackendApp({
    port: 0,
    delayMs: 1000,
    webSocketTransportFactory: async ({ httpServer, publisher, onCommand }) =>
      attachWebSocketTransport({
        httpServer,
        publisher,
        onCommand,
        webSocketServerFactory: () => ({
          on(event, handler) {
            if (event === 'connection') connectionHandler = handler;
          },
          close() {},
        }),
      }),
  });
  await app.start();
  try {
    const client = {
      readyState: 1,
      send(value) {
        messages.push(JSON.parse(value));
      },
      on(event, handler) {
        if (event === 'message') messageHandler = handler;
      },
    };
    connectionHandler(client);
    assert.equal(messages.length, 1);
    messageHandler(
      JSON.stringify({ type: 'COMMAND', command: 'SYNC_SET_DELAY', payload: { delayMs: 0 } }),
    );
    app.pipeline.process({ topic: 'TimingData', payload: { Lines: { 1: { Position: '1' } } } });
    assert.equal(messages.at(-1).type, 'STATE_UPDATE');
  } finally {
    await app.stop();
  }
});
