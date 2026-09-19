import test from 'node:test';
import assert from 'node:assert/strict';
import { createError, createStateSnapshot, serializeMessage } from './messages.js';

test('creates a source-independent state snapshot', () => {
  const message = createStateSnapshot({ timing: {} }, { mode: 'replay' });
  assert.equal(message.type, 'STATE_SNAPSHOT');
  assert.equal(message.protocolVersion, 1);
  assert.equal(message.payload.source.mode, 'replay');
  assert.deepEqual(message.payload.state, { timing: {} });
});

test('creates machine-readable errors without stack traces', () => {
  const message = createError('INVALID_MESSAGE', 'Invalid message.');
  assert.deepEqual(message, {
    type: 'ERROR',
    protocolVersion: 1,
    payload: { code: 'INVALID_MESSAGE', message: 'Invalid message.' },
  });
  assert.equal(serializeMessage(message).includes('stack'), false);
});
