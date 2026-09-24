import WebSocket from 'ws';
import {
  extractTopicEvents,
  frameSignalRMessage,
  parseSignalRFrame,
  splitSignalRFrames,
} from './signalr-framing.js';

const f1Origin = 'https://www.formula1.com';
const f1UserAgent = 'Mozilla/5.0 FormulaDelta/1.0';

export function createLiveSource({
  url,
  topics,
  hubMethod = 'Subscribe',
  fetchImpl = fetch,
  webSocketFactory = (value, options) => new WebSocket(value, options),
  onEvent = () => {},
  onStatus = () => {},
  onError = () => {},
  reconnectDelayMs = 1000,
  maxReconnectDelayMs = 30000,
  maxReconnectAttempts = Infinity,
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
      let negotiation;
      try {
        negotiation = await negotiate({ url, fetchImpl });
      } catch (error) {
        onStatus({ status: 'error' });
        onError(error);
        scheduleReconnect();
        return;
      }
      if (stopped) return;
      socket = webSocketFactory(buildWebSocketUrl(url, negotiation), negotiation.webSocketOptions);
      socket.onopen = () => {
        reconnectAttempts = 0;
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
    const delay = Math.min(
      reconnectDelayMs * 2 ** Math.max(reconnectAttempts - 1, 0),
      maxReconnectDelayMs,
    );
    onStatus({ status: 'reconnect-scheduled', attempt: reconnectAttempts, delayMs: delay });
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
    socket = webSocketFactory(buildWebSocketUrl(url, negotiation), negotiation.webSocketOptions);
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
  const negotiateUrl = `${url.replace(/\/$/, '')}/negotiate?negotiateVersion=1`;
  const preflight = await fetchImpl(negotiateUrl, {
    method: 'OPTIONS',
    headers: { Origin: f1Origin, 'user-agent': f1UserAgent },
  });
  const cookie = getAwsAlbCookies(preflight);
  const response = await fetchImpl(negotiateUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Origin: f1Origin,
      'user-agent': f1UserAgent,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: '{}',
  });
  if (!response.ok) throw new Error(`F1 negotiation failed with status ${response.status}`);
  return {
    ...(await response.json()),
    webSocketOptions: {
      headers: {
        Origin: f1Origin,
        'User-Agent': f1UserAgent,
        ...(cookie ? { Cookie: cookie } : {}),
      },
    },
  };
}

function getAwsAlbCookies(response) {
  const cookies = response?.headers?.getSetCookie?.() || [];
  return cookies
    .filter((value) => value.startsWith('AWSALB=') || value.startsWith('AWSALBCORS='))
    .map((value) => value.split(';', 1)[0])
    .join('; ');
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
