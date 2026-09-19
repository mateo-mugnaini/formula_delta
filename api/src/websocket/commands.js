import { createError } from './messages.js';

const supportedCommands = new Set([
  'REPLAY_PLAY', 'REPLAY_PAUSE', 'REPLAY_RESTART', 'REPLAY_SET_SPEED',
  'SYNC_SET_DELAY', 'SYNC_ADJUST_DELAY'
]);

export function parseClientCommand(input) {
  let message;
  try {
    message = JSON.parse(Buffer.isBuffer(input) ? input.toString('utf8') : String(input));
  } catch {
    return { error: createError('INVALID_JSON', 'Client message must be valid JSON.') };
  }
  if (!message || message.type !== 'COMMAND' || typeof message.command !== 'string') {
    return { error: createError('INVALID_COMMAND', 'Client message must use the COMMAND envelope.') };
  }
  if (!supportedCommands.has(message.command)) {
    return { error: createError('UNKNOWN_COMMAND', `Unsupported command: ${message.command}.`) };
  }
  return { command: message.command, payload: message.payload ?? {} };
}
