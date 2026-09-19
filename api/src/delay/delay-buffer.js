export function createDelayBuffer({ delayMs = 0, now = () => Date.now(), onReady = () => {}, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let configuredDelay = validateDelay(delayMs);
  let sequence = 0;
  let timer = null;
  const queue = [];

  return {
    enqueue(value, receivedAt = now()) {
      queue.push({ value, receivedAt, sequence: sequence++ });
      queue.sort(compareReadyTime);
      schedule();
    },
    setDelay(nextDelayMs) {
      configuredDelay = validateDelay(nextDelayMs);
      schedule(true);
    },
    getDelay: () => configuredDelay,
    flush(at = now()) {
      const ready = [];
      while (queue.length && readyAt(queue[0]) <= at) ready.push(queue.shift().value);
      ready.forEach(onReady);
      schedule();
      return ready;
    },
    clear() {
      if (timer !== null) clearTimer(timer);
      timer = null;
      queue.length = 0;
    },
    size: () => queue.length
  };

  function schedule(reset = false) {
    if (reset && timer !== null) {
      clearTimer(timer);
      timer = null;
    }
    if (timer !== null || !queue.length) return;
    const wait = Math.max(0, readyAt(queue[0]) - now());
    timer = setTimer(() => {
      timer = null;
      const emitted = buffer.flush();
      if (emitted.length) schedule();
    }, wait);
  }

  function readyAt(entry) { return entry.receivedAt + configuredDelay; }
  function compareReadyTime(a, b) { return readyAt(a) - readyAt(b) || a.sequence - b.sequence; }
}

function validateDelay(value) {
  if (!Number.isFinite(value) || value < 0 || value > 86_400_000) {
    throw new RangeError('Delay must be between 0 and 86400000 milliseconds.');
  }
  return Math.trunc(value);
}
