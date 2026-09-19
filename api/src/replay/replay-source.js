import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function loadRecording(directory, { onWarning = () => {} } = {}) {
  const content = await readFile(join(directory, 'events.jsonl'), 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  const events = [];
  for (const [index, line] of lines.entries()) {
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      const isFinalLine = index === lines.length - 1;
      if (!isFinalLine) throw error;
      onWarning({ type: 'incomplete-final-line', line: index + 1, error });
    }
  }
  return events;
}

export function createReplaySource({
  events,
  onEvent = () => {},
  onState = () => {},
  clock = () => Date.now(),
}) {
  let index = 0;
  let speed = 1;
  let status = 'idle';
  let timer = null;

  return {
    mode: 'replay',
    getState: () => ({ status, speed, index, total: events.length }),
    start() {
      this.play();
    },
    play() {
      if (status === 'completed') index = 0;
      if (status === 'playing' || events.length === 0) return;
      status = 'playing';
      clock();
      onState(this.getState());
      scheduleNext();
    },
    pause() {
      if (status !== 'playing') return;
      clearTimeout(timer);
      timer = null;
      status = 'paused';
      onState(this.getState());
    },
    restart() {
      clearTimeout(timer);
      timer = null;
      index = 0;
      status = 'idle';
      onState(this.getState());
    },
    stop() {
      clearTimeout(timer);
      timer = null;
      status = 'idle';
      onState(this.getState());
    },
    setSpeed(value) {
      if (![0.5, 1, 2, 5, 10].includes(value)) throw new Error('Unsupported replay speed.');
      speed = value;
      onState(this.getState());
    },
  };

  function scheduleNext() {
    if (status !== 'playing') return;
    if (index >= events.length) {
      status = 'completed';
      onState({ status, speed, index, total: events.length });
      return;
    }
    const event = events[index];
    const previousElapsed = index === 0 ? 0 : events[index - 1].elapsedMs;
    const waitMs = Math.max(0, (event.elapsedMs - previousElapsed) / speed);
    timer = setTimeout(() => {
      if (status !== 'playing') return;
      onEvent({
        receivedAt: clock(),
        topic: event.topic,
        payload: event.payload,
        replaySequence: event.sequence,
      });
      index += 1;
      scheduleNext();
    }, waitMs);
  }
}
