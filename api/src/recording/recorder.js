import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function createRecorder({ rootDir, recordingId, metadata = {} }) {
  const directory = join(rootDir, recordingId);
  const eventsPath = join(directory, 'events.jsonl');
  const metadataPath = join(directory, 'metadata.json');
  let sequence = 0;
  let startedAt = Date.now();
  let stopped = false;

  await mkdir(directory, { recursive: true });
  await writeMetadata({ status: 'recording' });

  return {
    directory,
    async record(event) {
      if (stopped) throw new Error('Cannot record after recorder stop.');
      const receivedAt = event.receivedAt ?? Date.now();
      const record = {
        type: 'event',
        sequence: ++sequence,
        elapsedMs: receivedAt - startedAt,
        receivedAt,
        topic: event.topic,
        payload: event.payload,
      };
      await appendFile(eventsPath, JSON.stringify(record) + '\n');
      return record;
    },
    async stop() {
      if (stopped) return;
      stopped = true;
      await writeMetadata({ status: 'complete' });
    },
  };

  async function writeMetadata(status) {
    await writeFile(
      metadataPath,
      JSON.stringify(
        {
          formatVersion: 1,
          recordingId,
          ...metadata,
          ...status,
          startedAt: new Date(startedAt).toISOString(),
          eventCount: sequence,
          durationMs: Date.now() - startedAt,
        },
        null,
        2,
      ) + '\n',
    );
  }
}
