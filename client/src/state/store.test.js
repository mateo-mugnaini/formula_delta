import test from 'node:test';
import assert from 'node:assert/strict';
import { useFormulaDeltaStore, selectDriverTiming } from './store.js';

test('store applies snapshots and exposes granular timing selectors', () => {
  const store = useFormulaDeltaStore.getState();
  store.reset();
  store.applyMessage({
    type: 'STATE_SNAPSHOT',
    protocolVersion: 1,
    payload: { state: { ...store, timing: { 1: { position: 1 } } } },
  });
  assert.equal(selectDriverTiming(useFormulaDeltaStore.getState(), '1').position, 1);
});

test('store tracks frontend connection status', () => {
  useFormulaDeltaStore.getState().setConnectionStatus('connected');
  assert.equal(useFormulaDeltaStore.getState().connectionStatus, 'connected');
  useFormulaDeltaStore.getState().reset();
});

test('stores a bounded gap history from timing updates', () => {
  const store = useFormulaDeltaStore.getState();
  store.reset();
  for (let index = 0; index < 35; index += 1) {
    store.applyMessage({
      type: 'STATE_UPDATE',
      protocolVersion: 1,
      payload: {
        change: { kind: 'timing' },
        value: { 10: { gapToLeader: { milliseconds: index } } },
      },
    });
  }
  const history = useFormulaDeltaStore.getState().gapHistory['10'];
  assert.equal(history.length, 30);
  assert.equal(history[0], 5);
});
