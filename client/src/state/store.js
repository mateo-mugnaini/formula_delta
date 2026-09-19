import { create } from 'zustand';
import { applyServerMessage, createInitialClientState } from '../websocket/protocol.js';

export const useFormulaDeltaStore = create((set) => ({
  ...createInitialClientState(),
  connectionStatus: 'idle',
  applyMessage: (message) => set((state) => applyServerMessage(state, message)),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  reset: () => set({ ...createInitialClientState(), connectionStatus: 'idle' }),
}));

export function selectDriverTiming(state, driverId) {
  return state.timing?.[driverId] ?? null;
}
