import test from 'node:test';
import assert from 'node:assert/strict';
import { createWebSocketClient } from './client.js';

test('connects, consumes messages, and reconnects after close', async () => {
  const sockets = [];
  const statuses = [];
  class FakeWebSocket {
    constructor() { this.listeners = {}; sockets.push(this); }
    addEventListener(name, handler) { (this.listeners[name] ??= []).push(handler); }
    emit(name, value) { for (const handler of this.listeners[name] ?? []) handler(value); }
    send() {}
    close() {}
  }
  const client = createWebSocketClient({ url: 'ws://test', WebSocketImpl: FakeWebSocket, reconnectMs: 1, onConnection: (status) => statuses.push(status) });
  sockets[0].emit('open');
  sockets[0].emit('message', { data: JSON.stringify({ type: 'STATE_SNAPSHOT', protocolVersion: 1, payload: { state: { timing: { '1': { position: 1 } } } } }) });
  assert.equal(client.getState().timing['1'].position, 1);
  sockets[0].emit('close');
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(sockets.length, 2);
  assert.deepEqual(statuses.slice(0, 3), ['connecting', 'connected', 'disconnected']);
  client.stop();
});
