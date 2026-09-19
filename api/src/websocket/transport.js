export function attachWebSocketTransport({ httpServer, publisher, webSocketServerFactory }) {
  const webSocketServer = webSocketServerFactory({ server: httpServer });
  webSocketServer.on('connection', (client) => {
    const disconnect = publisher.connect(client);
    client.on?.('close', disconnect);
  });
  return webSocketServer;
}

export async function createWebSocketTransport({ httpServer, publisher }) {
  const { WebSocketServer } = await import('ws');
  return attachWebSocketTransport({ httpServer, publisher, webSocketServerFactory: (options) => new WebSocketServer(options) });
}
