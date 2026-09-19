import { mkdir, appendFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEFAULT_URL = 'https://livetiming.formula1.com/signalrcore';
const DEFAULT_DURATION_MS = 5 * 60 * 1000;
const DEFAULT_MAX_RECONNECTS = 3;
const RECORD_SEPARATOR = '\u001e';

const coreTopics = [
  'SessionInfo',
  'SessionStatus',
  'SessionData',
  'DriverList',
  'TimingData',
  'TimingAppData',
  'TimingStats',
  'LapCount',
  'TrackStatus',
  'RaceControlMessages',
  'WeatherData',
  'TeamRadio',
  'TopThree',
  'ExtrapolatedClock',
  'Heartbeat',
  'CarData.z',
  'Position.z'
];

const config = readConfig();
const startedAt = Date.now();
const outputDir = join(config.outputDir, new Date(startedAt).toISOString().replaceAll(':', '-'));
const eventsPath = join(outputDir, 'events.jsonl');
const transportPath = join(outputDir, 'transport.jsonl');
const metadataPath = join(outputDir, 'metadata.json');
const summary = {
  connection: 'not-started',
  startedAt: new Date(startedAt).toISOString(),
  durationMs: 0,
  messages: 0,
  events: 0,
  topics: {},
  unknownMessages: 0,
  reconnects: 0,
  errors: []
};

let sequence = 0;
let socket;
let stopTimer;
let stopped = false;
let resolveRun;
let reconnecting = false;

await mkdir(outputDir, { recursive: true });
await writeFile(metadataPath, JSON.stringify({ config, status: 'started' }, null, 2) + '\n');

log(`Formula Delta F1 probe starting: ${config.url}`);
log(`Output: ${outputDir}`);

try {
  await run();
} catch (error) {
  summary.connection = 'failed';
  summary.errors.push(toError(error));
  logError(error);
} finally {
  await finish();
}

function readConfig() {
  const topics = parseJsonEnv('F1_PROBE_TOPICS_JSON', coreTopics);
  const subscriptionArgs = process.env.F1_PROBE_SUBSCRIPTION_ARGS_JSON
    ? parseJsonEnv('F1_PROBE_SUBSCRIPTION_ARGS_JSON', [topics])
    : [topics];

  return {
    url: process.env.F1_SIGNALR_URL || DEFAULT_URL,
    durationMs: numberEnv('F1_PROBE_DURATION_MS', DEFAULT_DURATION_MS),
    maxReconnects: numberEnv('F1_PROBE_MAX_RECONNECTS', DEFAULT_MAX_RECONNECTS),
    outputDir: process.env.F1_PROBE_OUTPUT_DIR || './output',
    hubMethod: process.env.F1_PROBE_HUB_METHOD || 'Subscribe',
    topics,
    subscriptionArgs
  };
}

async function run() {
  if (typeof WebSocket !== 'function') {
    throw new Error('This probe requires a Node.js runtime with the standard WebSocket API.');
  }

  summary.connection = 'negotiating';
  const negotiation = await negotiate(config.url);
  const websocketUrl = buildWebSocketUrl(negotiation);
  log(`Negotiation succeeded. WebSocket URL: ${redactUrl(websocketUrl)}`);

  await connect(websocketUrl);
  await new Promise((resolve) => {
    resolveRun = resolve;
    if (config.durationMs > 0) {
      stopTimer = setTimeout(() => stop('duration reached'), config.durationMs);
    }
  });
}

async function negotiate(baseUrl) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/negotiate?negotiateVersion=1`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}'
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Negotiation failed (${response.status}): ${text.slice(0, 500)}`);
  }

  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`Negotiation returned non-JSON data: ${text.slice(0, 500)}`);
  }

  await recordTransport({ type: 'negotiate-response', receivedAt: Date.now(), payload: value });
  return value;
}

function buildWebSocketUrl(negotiation) {
  if (negotiation.url) return negotiation.url;

  const url = new URL(config.url);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('id', negotiation.connectionToken || negotiation.connectionId || '');
  return url.toString();
}

function connect(url) {
  return new Promise((resolve, reject) => {
    let opened = false;
    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
      opened = true;
      summary.connection = 'connected';
      log('WebSocket connected. Sending SignalR handshake.');
      socket.send(JSON.stringify({ protocol: 'json', version: 1 }) + RECORD_SEPARATOR);
      setTimeout(() => {
        if (socket?.readyState === WebSocket.OPEN) sendSubscription();
      }, 250);
      resolve();
    });

    socket.addEventListener('message', (event) => {
      void handleMessage(String(event.data));
    });

    socket.addEventListener('error', (event) => {
      const error = new Error(`WebSocket error: ${event.message || 'unknown error'}`);
      summary.errors.push(toError(error));
      if (!opened) reject(error);
      else logError(error);
    });

    socket.addEventListener('close', (event) => {
      if (!stopped) {
        summary.connection = 'closed';
        log(`WebSocket closed: code=${event.code} reason=${event.reason || 'none'}`);
        void reconnect();
      }
    });
  });
}

async function reconnect() {
  if (reconnecting || stopped || summary.reconnects >= config.maxReconnects) {
    if (!stopped && summary.reconnects >= config.maxReconnects) {
      log(`Reconnect limit reached (${config.maxReconnects}).`);
      stop('reconnect limit reached');
    }
    return;
  }

  reconnecting = true;
  summary.reconnects += 1;
  const delayMs = Math.min(30_000, 1_000 * (2 ** (summary.reconnects - 1)));
  summary.connection = 'reconnecting';
  log(`Reconnect attempt ${summary.reconnects}/${config.maxReconnects} in ${delayMs}ms.`);

  await new Promise((resolve) => setTimeout(resolve, delayMs));
  if (stopped) return;

  try {
    const negotiation = await negotiate(config.url);
    await connect(buildWebSocketUrl(negotiation));
    summary.connection = 'connected';
    log('WebSocket reconnected.');
  } catch (error) {
    summary.errors.push(toError(error));
    logError(error);
    reconnecting = false;
    await reconnect();
    return;
  }

  reconnecting = false;
}

function sendSubscription() {
  const message = {
    type: 1,
    invocationId: String(++sequence),
    target: config.hubMethod,
    arguments: config.subscriptionArgs
  };
  log(`Sending subscription target=${config.hubMethod}`);
  socket.send(JSON.stringify(message) + RECORD_SEPARATOR);
}

async function handleMessage(rawMessage) {
  const receivedAt = Date.now();
  const frames = rawMessage.split(RECORD_SEPARATOR).filter(Boolean);

  for (const frame of frames) {
    summary.messages += 1;
    await recordTransport({ receivedAt, payload: frame });

    let message;
    try {
      message = JSON.parse(frame);
    } catch {
      summary.unknownMessages += 1;
      log(`Non-JSON SignalR frame received (${frame.length} bytes).`);
      continue;
    }

    if (frame === '{}') {
      log('SignalR handshake acknowledged.');
      continue;
    }

    if (message.type === 6) {
      socket?.send(RECORD_SEPARATOR);
      continue;
    }

    if (message.type === 7) {
      summary.errors.push(toError(new Error(`SignalR close message: ${message.error || 'unknown error'}`)));
      logError(new Error(`SignalR close message: ${message.error || 'unknown error'}`));
      continue;
    }

    if (message.type === 3 && message.result && typeof message.result === 'object') {
      for (const [topic, payload] of Object.entries(message.result)) {
        await recordEvent(topic, payload, receivedAt, 'signalr-result-snapshot');
      }
      continue;
    }

    const topic = extractTopic(message);
    if (!topic) {
      summary.unknownMessages += 1;
      log(`Unidentified message type=${message.type ?? 'missing'}`);
      continue;
    }

    await recordEvent(topic, extractPayload(message), receivedAt, 'signalr-invocation');
  }
}

async function recordEvent(topic, payload, receivedAt, extraction) {
  summary.events += 1;
  summary.topics[topic] = (summary.topics[topic] || 0) + 1;
  await appendFile(eventsPath, JSON.stringify({
      type: 'event',
      sequence: summary.events,
      receivedAt,
      topic,
      payload,
      extraction
    }) + '\n');
}

function extractTopic(message) {
  if (message.type === 1 && typeof message.target === 'string') return message.target;
  if (typeof message.topic === 'string') return message.topic;
  if (typeof message.type === 'string' && message.type !== 'event') return message.type;
  return null;
}

function extractPayload(message) {
  if (message.type === 1 && Array.isArray(message.arguments)) {
    return message.arguments.length === 1 ? message.arguments[0] : message.arguments;
  }
  return message.payload ?? message;
}

async function recordTransport(value) {
  await appendFile(transportPath, JSON.stringify(value) + '\n');
}

function stop(reason) {
  if (stopped) return;
  stopped = true;
  log(`Stopping probe: ${reason}`);
  socket?.close(1000, reason);
  resolveRun?.();
}

async function finish() {
  clearTimeout(stopTimer);
  if (!stopped) stop('completed');
  summary.durationMs = Date.now() - startedAt;
  await writeFile(metadataPath, JSON.stringify({ config, summary }, null, 2) + '\n');
  log(`Finished. Messages=${summary.messages}, events=${summary.events}, topics=${Object.keys(summary.topics).length}`);
}

function parseJsonEnv(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${name} must contain valid JSON: ${error.message}`);
  }
}

function numberEnv(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative number.`);
  return parsed;
}

function redactUrl(value) {
  try {
    const url = new URL(value);
    if (url.searchParams.has('id')) url.searchParams.set('id', '[redacted]');
    return url.toString();
  } catch {
    return '[invalid url]';
  }
}

function toError(error) {
  return { name: error.name, message: error.message };
}

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logError(error) {
  console.error(`[${new Date().toISOString()}] ERROR ${error.message}`);
}

process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
