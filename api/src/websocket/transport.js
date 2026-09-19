import { parseClientCommand } from './commands.js';

export function attachWebSocketTransport({
  httpServer,
  publisher,
  webSocketServerFactory,
  onCommand = () => {},
}) {
  const webSocketServer = webSocketServerFactory({ server: httpServer });
  webSocketServer.on('connection', (client) => {
    const disconnect = publisher.connect(client);
    client.on?.('close', disconnect);
    client.on?.('message', (input) => {
      const result = parseClientCommand(input);
      if (result.error) {
        sendError(client, result.error);
        return;
      }
      onCommand({ client, ...result });
    });
  });
  return webSocketServer;
}

function sendError(client, error) {
  if (client.readyState !== undefined && client.readyState !== 1) return;
  client.send(JSON.stringify(error));
}

export async function createWebSocketTransport({ httpServer, publisher }) {
  const { WebSocketServer } = await import('ws');
  return attachWebSocketTransport({
    httpServer,
    publisher,
    webSocketServerFactory: (options) => new WebSocketServer(options),
  });
}
