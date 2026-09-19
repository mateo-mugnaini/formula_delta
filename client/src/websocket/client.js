import { applyServerMessage, createInitialClientState } from './protocol.js';

export function createWebSocketClient({ url, WebSocketImpl = WebSocket, onState = () => {}, onConnection = () => {}, reconnectMs = 1000 } = {}) {
  let socket;
  let stopped = false;
  let state = createInitialClientState();
  const connect = () => {
    if (stopped) return;
    onConnection('connecting');
    socket = new WebSocketImpl(url);
    socket.addEventListener('open', () => onConnection('connected'));
    socket.addEventListener('message', (event) => {
      try {
        const next = applyServerMessage(state, JSON.parse(event.data));
        if (next !== state) { state = next; onState(state, event); }
      } catch { onConnection('protocol-error'); }
    });
    socket.addEventListener('close', () => { onConnection('disconnected'); if (!stopped) setTimeout(connect, reconnectMs); });
    socket.addEventListener('error', () => onConnection('error'));
  };
  connect();
  return { getState: () => state, send: (message) => socket?.send(JSON.stringify(message)), stop: () => { stopped = true; socket?.close(); } };
}
