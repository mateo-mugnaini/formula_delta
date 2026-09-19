import { createServer } from 'node:http';
import { createIngestionPipeline } from './f1/event-pipeline.js';

export function createBackendApp({ source = null, host = '127.0.0.1', port = 3000, onStatus = () => {} } = {}) {
  const pipeline = createIngestionPipeline({
    onParsedUpdate: ({ parsed, state }) => onStatus({ type: 'state-update', parsed, state })
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
      await new Promise((resolve) => server.listen(port, host, resolve));
      onStatus({ type: 'started', host, port });
      if (source) await source.start();
    },
    async stop() {
      source?.stop();
      if (server.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      onStatus({ type: 'stopped' });
    }
  };
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}
