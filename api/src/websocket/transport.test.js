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
  const client = { on(event, handler) { assert.equal(event, 'close'); this.closeHandler = handler; } };
  transport.handler(client);
  client.closeHandler();
  assert.equal(connections.length, 1);
  assert.equal(client.disconnected, true);
});
