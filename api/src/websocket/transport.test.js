import test from 'node:test';
import assert from 'node:assert/strict';
import { attachWebSocketTransport } from './transport.js';

test('adapts WebSocket connections to the publisher', () => {
  const connections = [];
  const transport = { on(event, handler) { this.handler = handler; assert.equal(event, 'connection'); } };
  const publisher = { connect(client) { connections.push(client); return () => { client.disconnected = true; }; } };
  attachWebSocketTransport({
    httpServer: {}, publisher,
    webSocketServerFactory: (options) => { assert.equal(options.server !== undefined, true); return transport; }
  });
  const client = { on(event, handler) { if (event === 'close') this.closeHandler = handler; } };
  transport.handler(client);
  client.closeHandler();
  assert.equal(connections.length, 1);
  assert.equal(client.disconnected, true);
});

test('rejects malformed client messages and forwards valid commands', () => {
  let messageHandler;
  let received;
  const transport = { on(event, handler) { this.handler = handler; } };
  const publisher = { connect() { return () => {}; } };
  attachWebSocketTransport({
    httpServer: {}, publisher,
    onCommand: (command) => { received = command; },
    webSocketServerFactory: () => transport
  });
  const client = { readyState: 1, sent: [], send(value) { this.sent.push(JSON.parse(value)); }, on(event, handler) {
    if (event === 'message') messageHandler = handler;
  } };
  transport.handler(client);
  messageHandler('{"type":"COMMAND","command":"REPLAY_PAUSE"}');
  assert.equal(received.command, 'REPLAY_PAUSE');
  messageHandler('{');
  assert.equal(client.sent[0].payload.code, 'INVALID_JSON');
});
