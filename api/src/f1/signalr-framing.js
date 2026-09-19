const RECORD_SEPARATOR = '\u001e';

export function frameSignalRMessage(message) {
  return JSON.stringify(message) + RECORD_SEPARATOR;
}

export function splitSignalRFrames(raw) {
  return String(raw).split(RECORD_SEPARATOR).filter(Boolean);
}

export function parseSignalRFrame(frame) {
  if (frame === '{}') return { kind: 'handshake-ack' };

  const message = JSON.parse(frame);
  if (message.type === 6) return { kind: 'ping', message };
  if (message.type === 7) return { kind: 'close', error: message.error ?? null, message };
  if (message.type === 3) return { kind: 'completion', message };
  if (message.type === 1) {
    return {
      kind: 'invocation',
      target: message.target ?? null,
      arguments: Array.isArray(message.arguments) ? message.arguments : [],
      message,
    };
  }
  return { kind: 'unknown', message };
}

export function extractTopicEvents(parsed) {
  if (
    parsed.kind === 'completion' &&
    parsed.message.result &&
    typeof parsed.message.result === 'object'
  ) {
    return Object.entries(parsed.message.result).map(([topic, payload]) => ({ topic, payload }));
  }

  if (parsed.kind === 'invocation' && parsed.target) {
    return [
      {
        topic: parsed.target,
        payload: parsed.arguments.length === 1 ? parsed.arguments[0] : parsed.arguments,
      },
    ];
  }

  return [];
}
