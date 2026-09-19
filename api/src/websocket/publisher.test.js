import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublisher } from './publisher.js';

function fakeClient() {
  return {
    readyState: 1,
    messages: [],
    send(message) {
      this.messages.push(JSON.parse(message));
    },
    close() {
      this.closed = true;
    },
  };
}

test('sends an authoritative snapshot when a client connects', () => {
  const publisher = createPublisher({
    getState: () => ({ timing: {} }),
    source: { mode: 'replay' },
  });
  const client = fakeClient();
  publisher.connect(client);
  assert.equal(publisher.clientCount(), 1);
  assert.equal(client.messages[0].type, 'STATE_SNAPSHOT');
  assert.equal(client.messages[0].payload.source.mode, 'replay');
});

test('broadcasts to connected clients and removes disconnected clients', () => {
  const publisher = createPublisher({ getState: () => ({}) });
  const first = fakeClient();
  const second = fakeClient();
  const disconnect = publisher.connect(first);
  publisher.connect(second);
  publisher.broadcast({ type: 'TIMING_UPDATE', payload: { drivers: {} } });
  assert.equal(first.messages.length, 2);
  assert.equal(second.messages.length, 2);
  disconnect();
  assert.equal(publisher.clientCount(), 1);
});
