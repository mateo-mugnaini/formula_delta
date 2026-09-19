import { createStateSnapshot, serializeMessage } from './messages.js';

export function createPublisher({
  getState,
  source = { mode: 'unknown' },
  serialize = serializeMessage,
} = {}) {
  const clients = new Set();
  return {
    connect(client) {
      clients.add(client);
      send(client, createStateSnapshot(getState(), source));
      return () => clients.delete(client);
    },
    broadcast(message) {
      for (const client of clients) send(client, message);
    },
    clientCount: () => clients.size,
    close() {
      for (const client of clients) client.close?.();
      clients.clear();
    },
  };

  function send(client, message) {
    if (client.readyState !== undefined && client.readyState !== 1) return;
    client.send(serialize(message));
  }
}
