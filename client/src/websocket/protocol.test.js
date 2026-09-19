import test from 'node:test';
import assert from 'node:assert/strict';
import { applyServerMessage, createInitialClientState } from './protocol.js';

test('reconstructs client state from snapshot and incremental updates', () => {
  const snapshot = { ...createInitialClientState(), timing: { '1': { position: 1 } } };
  const state = applyServerMessage(createInitialClientState(), { type: 'STATE_SNAPSHOT', protocolVersion: 1, payload: { source: { mode: 'replay' }, state: snapshot } });
  assert.equal(state.source.mode, 'replay');
  const next = applyServerMessage(state, { type: 'STATE_UPDATE', protocolVersion: 1, payload: { change: { kind: 'timing' }, value: { '1': { position: 2 } } } });
  assert.equal(next.timing['1'].position, 2);
});

test('ignores incompatible or unknown messages', () => {
  const state = createInitialClientState();
  assert.equal(applyServerMessage(state, { type: 'STATE_SNAPSHOT', protocolVersion: 2, payload: { state: {} } }), state);
  assert.equal(applyServerMessage(state, { type: 'STATE_UPDATE', protocolVersion: 1, payload: { change: { kind: 'unknown' }, value: {} } }), state);
});
