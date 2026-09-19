import test from 'node:test';
import assert from 'node:assert/strict';
import { useFormulaDeltaStore, selectDriverTiming } from './store.js';

test('store applies snapshots and exposes granular timing selectors', () => {
  const store = useFormulaDeltaStore.getState();
  store.reset();
  store.applyMessage({ type: 'STATE_SNAPSHOT', protocolVersion: 1, payload: { state: { ...store, timing: { '1': { position: 1 } } } } });
  assert.equal(selectDriverTiming(useFormulaDeltaStore.getState(), '1').position, 1);
});

test('store tracks frontend connection status', () => {
  useFormulaDeltaStore.getState().setConnectionStatus('connected');
  assert.equal(useFormulaDeltaStore.getState().connectionStatus, 'connected');
  useFormulaDeltaStore.getState().reset();
});
