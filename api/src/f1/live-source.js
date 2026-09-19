import {
  extractTopicEvents,
  frameSignalRMessage,
  parseSignalRFrame,
  splitSignalRFrames,
} from './signalr-framing.js';

export function createLiveSource({
  url,
  topics,
  hubMethod = 'Subscribe',
  fetchImpl = fetch,
  webSocketFactory = (value) => new WebSocket(value),
  onEvent = () => {},
  onStatus = () => {},
  onError = () => {},
  reconnectDelayMs = 1000,
  maxReconnectAttempts = 5,
}) {
  let socket = null;
  let invocationId = 0;
  let stopped = false;
  let reconnectAttempts = 0;
  let reconnectTimer = null;

  return {
    mode: 'live',
    async start() {
      stopped = false;
      onStatus({ status: 'negotiating' });
      const negotiation = await negotiate({ url, fetchImpl });
      if (stopped) return;
      reconnectAttempts = 0;
      socket = webSocketFactory(buildWebSocketUrl(url, negotiation));
      socket.onopen = () => {
        onStatus({ status: 'connected' });
        socket.send(frameSignalRMessage({ protocol: 'json', version: 1 }));
      };
      socket.onmessage = (event) => handleMessage(String(event.data));
      socket.onerror = (error) => {
        onStatus({ status: 'error' });
        onError(error);
      };
      socket.onclose = (event) => {
        if (stopped) return;
        onStatus({ status: 'closed', code: event.code, reason: event.reason });
        scheduleReconnect();
      };
    },
    stop() {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = null;
      onStatus({ status: 'stopping' });
      socket?.close(1000, 'source stopped');
      socket = null;
      onStatus({ status: 'stopped' });
    },
  };

  function scheduleReconnect() {
    if (reconnectTimer || reconnectAttempts >= maxReconnectAttempts) {
      if (reconnectAttempts >= maxReconnectAttempts) onStatus({ status: 'reconnect-exhausted' });
      return;
    }
    reconnectAttempts += 1;
    onStatus({ status: 'reconnecting', attempt: reconnectAttempts });
    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;
      try {
        await connect();
      } catch (error) {
        onError(error);
        scheduleReconnect();
      }
    }, reconnectDelayMs);
  }

  async function connect() {
    onStatus({ status: 'negotiating' });
    const negotiation = await negotiate({ url, fetchImpl });
    if (stopped) return;
    socket = webSocketFactory(buildWebSocketUrl(url, negotiation));
    socket.onopen = () => {
      onStatus({ status: 'connected' });
      socket.send(frameSignalRMessage({ protocol: 'json', version: 1 }));
    };
    socket.onmessage = (event) => handleMessage(String(event.data));
    socket.onerror = (error) => {
      onStatus({ status: 'error' });
      onError(error);
    };
    socket.onclose = (event) => {
      if (!stopped) {
        onStatus({ status: 'closed', code: event.code, reason: event.reason });
        scheduleReconnect();
      }
    };
  }

  function handleMessage(raw) {
    for (const frame of splitSignalRFrames(raw)) {
      let parsed;
      try {
        parsed = parseSignalRFrame(frame);
      } catch (error) {
        onError(error);
        continue;
      }
      if (parsed.kind === 'handshake-ack') {
        socket.send(
          frameSignalRMessage({
            type: 1,
            invocationId: String(++invocationId),
            target: hubMethod,
            arguments: [topics],
          }),
        );
      } else if (parsed.kind === 'ping') {
        socket.send('\u001e');
      } else if (parsed.kind === 'close') {
        onError(new Error(parsed.error || 'SignalR close message'));
      }
      for (const { topic, payload } of extractTopicEvents(parsed)) {
        onEvent({ topic, payload, receivedAt: Date.now(), rawMessage: parsed.message ?? null });
      }
    }
  }
}

export async function negotiate({ url, fetchImpl }) {
  const response = await fetchImpl(`${url.replace(/\/$/, '')}/negotiate?negotiateVersion=1`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  if (!response.ok) throw new Error(`F1 negotiation failed with status ${response.status}`);
  return response.json();
}

export function buildWebSocketUrl(baseUrl, negotiation) {
  if (negotiation.url) return negotiation.url;
  const websocketUrl = new URL(baseUrl);
  websocketUrl.protocol = websocketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  websocketUrl.searchParams.set(
    'id',
    negotiation.connectionToken || negotiation.connectionId || '',
  );
  return websocketUrl.toString();
}
