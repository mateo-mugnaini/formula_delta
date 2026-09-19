import { createServer } from 'node:http';
import { createIngestionPipeline } from './f1/event-pipeline.js';
import { createPublisher } from './websocket/publisher.js';
import { createReplayState, createStateUpdate } from './websocket/messages.js';
import { createWebSocketTransport } from './websocket/transport.js';
import { createDelayBuffer } from './delay/delay-buffer.js';

export function createBackendApp({
  source = null,
  host = '127.0.0.1',
  port = 3000,
  delayMs = 0,
  onStatus = () => {},
  webSocketTransportFactory = createWebSocketTransport,
} = {}) {
  let publisher;
  let webSocketServer;
  const delayBuffer = createDelayBuffer({
    delayMs,
    onReady: (message) => publisher?.broadcast(message),
  });
  const pipeline = createIngestionPipeline({
    onParsedUpdate: ({ parsed, state }) => {
      const message = createStateUpdate(state, { kind: parsed.kind });
      if (delayBuffer.getDelay() === 0) publisher?.broadcast(message);
      else delayBuffer.enqueue(message);
      onStatus({ type: 'state-update', parsed, state });
    },
  });
  publisher = createPublisher({
    getState: pipeline.getState,
    source: { mode: source?.mode || 'unknown' },
  });

  const server = createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      return sendJson(response, 200, { status: 'ok', source: source ? 'configured' : 'none' });
    }
    if (request.method === 'GET' && request.url === '/snapshot') {
      return sendJson(response, 200, pipeline.getState());
    }
    sendJson(response, 404, { error: 'not-found' });
  });

  return {
    pipeline,
    server,
    async start() {
      await listen(server, port, host);
      webSocketServer = await webSocketTransportFactory({
        httpServer: server,
        publisher,
        onCommand: ({ command, payload }) => handleCommand(command, payload),
      });
      onStatus({ type: 'started', host, port });
      if (source) await source.start();
    },
    async stop() {
      source?.stop();
      delayBuffer.clear();
      webSocketServer?.close?.();
      publisher.close();
      if (server.listening)
        await new Promise((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      onStatus({ type: 'stopped' });
    },
  };

  function handleCommand(command, payload) {
    try {
      if (command === 'SYNC_SET_DELAY') {
        delayBuffer.setDelay(payload?.delayMs);
        return;
      }
      if (command === 'SYNC_ADJUST_DELAY') {
        delayBuffer.setDelay(delayBuffer.getDelay() + payload?.deltaMs);
        return;
      }
      if (source?.mode === 'replay') {
        if (command === 'REPLAY_PLAY' || command === 'REPLAY_PAUSE' || command === 'REPLAY_RESTART')
          source[command.replace('REPLAY_', '').toLowerCase()]();
        if (command === 'REPLAY_SET_SPEED') source.setSpeed(payload?.speed);
        publisher.broadcast(createReplayState(source.getState()));
      }
    } catch (error) {
      onStatus({ type: 'command-error', command, error });
    }
  }
}

function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.removeListener('listening', onListening);
      reject(createListenError(error, host, port));
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

function createListenError(error, host, port) {
  if (error?.code === 'EADDRINUSE') {
    return new Error(
      `Backend port is already in use: ${host}:${port}. Set FORMULA_DELTA_PORT to use another port.`,
    );
  }
  return error;
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}
