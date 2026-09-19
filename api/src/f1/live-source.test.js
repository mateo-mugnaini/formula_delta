import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWebSocketUrl, createLiveSource } from './live-source.js';
import { frameSignalRMessage } from './signalr-framing.js';

test('builds a WebSocket URL from negotiation data', () => {
  assert.equal(
    buildWebSocketUrl('https://example.test/signalrcore', { connectionToken: 'token' }),
    'wss://example.test/signalrcore?id=token',
  );
});

test('LiveSource performs handshake, subscription, and emits raw topic events', async () => {
  const sent = [];
  const events = [];
  const statuses = [];
  const socket = {
    send: (message) => sent.push(message),
    close: () => {},
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
  };
  const source = createLiveSource({
    url: 'https://example.test/signalrcore',
    topics: ['TimingData'],
    fetchImpl: async () => ({ ok: true, json: async () => ({ connectionId: 'abc' }) }),
    webSocketFactory: () => socket,
    onEvent: (event) => events.push(event),
    onStatus: (status) => statuses.push(status.status),
  });
  await source.start();
  socket.onopen();
  socket.onmessage({ data: '{}\u001e' });
  socket.onmessage({
    data: frameSignalRMessage({ type: 3, result: { TimingData: { Lines: {} } } }),
  });
  assert.equal(sent.length, 2);
  assert.deepEqual(statuses.slice(0, 2), ['negotiating', 'connected']);
  assert.deepEqual(events[0].payload, { Lines: {} });
});

test('LiveSource reconnects after an unexpected close and stops retrying when stopped', async () => {
  const sockets = [];
  const statuses = [];
  const source = createLiveSource({
    url: 'https://example.test/signalrcore',
    topics: ['TimingData'],
    reconnectDelayMs: 0,
    maxReconnectAttempts: 2,
    fetchImpl: async () => ({ ok: true, json: async () => ({ connectionId: 'abc' }) }),
    webSocketFactory: () => {
      const socket = { send() {}, close() {} };
      sockets.push(socket);
      return socket;
    },
    onStatus: (status) => statuses.push(status.status),
  });

  await source.start();
  sockets[0].onopen();
  sockets[0].onclose({ code: 1006, reason: 'network lost' });
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(sockets.length, 2);
  assert.ok(statuses.includes('reconnecting'));

  await source.stop();
  sockets[1].onclose({ code: 1006, reason: 'network lost' });
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(sockets.length, 2);
});
