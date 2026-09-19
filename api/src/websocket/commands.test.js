import test from 'node:test';
import assert from 'node:assert/strict';
import { parseClientCommand } from './commands.js';

test('accepts supported command envelopes', () => {
  assert.deepEqual(parseClientCommand('{"type":"COMMAND","command":"REPLAY_PAUSE"}'), {
    command: 'REPLAY_PAUSE', payload: {}
  });
});

test('rejects malformed and unknown client commands', () => {
  assert.equal(parseClientCommand('{').error.payload.code, 'INVALID_JSON');
  assert.equal(parseClientCommand('{"type":"NOPE"}').error.payload.code, 'INVALID_COMMAND');
  assert.equal(parseClientCommand('{"type":"COMMAND","command":"DROP_DATABASE"}').error.payload.code, 'UNKNOWN_COMMAND');
});
