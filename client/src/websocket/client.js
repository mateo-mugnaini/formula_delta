import { applyServerMessage, createInitialClientState } from './protocol.js';

export function createWebSocketClient({
  url,
  WebSocketImpl = WebSocket,
  onState = () => {},
  onConnection = () => {},
  reconnectMs = 1000,
  logger = console,
} = {}) {
  let socket;
  let stopped = false;
  let state = createInitialClientState();
  const connect = () => {
    if (stopped) return;
    onConnection('connecting');
    logger.info?.('[client] WebSocket connecting', { url });
    socket = new WebSocketImpl(url);
    socket.addEventListener('open', () => {
      logger.info?.('[client] WebSocket connected');
      onConnection('connected');
    });
    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        const next = applyServerMessage(state, message);
        if (next !== state) {
          state = next;
          logger.debug?.('[client] State message received', { type: message?.type });
          onState(state, event);
        }
      } catch (error) {
        logger.error?.('[client] WebSocket message/protocol error', { message: error?.message });
        onConnection('protocol-error');
      }
    });
    socket.addEventListener('close', (event) => {
      logger.warn?.('[client] WebSocket disconnected', { code: event?.code });
      onConnection('disconnected');
      if (!stopped) setTimeout(connect, reconnectMs);
    });
    socket.addEventListener('error', () => onConnection('error'));
  };
  connect();
  return {
    getState: () => state,
    send: (message) => socket?.send(JSON.stringify(message)),
    stop: () => {
      stopped = true;
      socket?.close();
    },
  };
}
