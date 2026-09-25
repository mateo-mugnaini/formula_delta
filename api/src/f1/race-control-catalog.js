import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

// Local discovery artifact. It is intentionally not part of the application state.
export async function createRaceControlCatalog({ filePath = 'output/race-control-glossary.json', session = {} } = {}) {
  await mkdir(dirname(filePath), { recursive: true });
  const catalog = await loadCatalog(filePath, session);
  let writeChain = Promise.resolve();

  return {
    record(events = []) {
      let changed = false;
      for (const event of events) {
        const message = String(event?.message || '').trim();
        if (!message) continue;
        const template = normalizeMessageTemplate(message);
        const key = `${event.category || 'Unknown'}:${template}`;
        const entry = catalog.messages[key] || {
          category: event.category || null,
          template,
          count: 0,
          examples: [],
          fields: detectVariableFields(message),
        };
        entry.count += 1;
        if (!entry.examples.includes(message) && entry.examples.length < 8) entry.examples.push(message);
        catalog.messages[key] = entry;
        changed = true;
      }
      if (changed) {
        catalog.updatedAt = new Date().toISOString();
        writeChain = writeChain.then(() => writeFile(filePath, `${JSON.stringify(catalog, null, 2)}\n`));
      }
      return writeChain;
    },
    async close() { await writeChain; },
    filePath,
  };
}

async function loadCatalog(filePath, session) {
  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    return { ...parsed, messages: parsed.messages || {} };
  } catch {
    return { formatVersion: 1, purpose: 'Observed Race Control message glossary', session, createdAt: new Date().toISOString(), updatedAt: null, messages: {} };
  }
}

export function normalizeMessageTemplate(message) {
  return message
    .replace(/\(\d{1,2}:\d{2}:\d{2}\)/g, '(<TIME>)')
    .replace(/\bCAR\s+\d+\s*\([^)]+\)/gi, 'CAR <NUMBER> (<DRIVER>)')
    .replace(/\bTURN\s+\d+\b/gi, 'TURN <TURN>')
    .replace(/\bSECTOR\s+\d+\b/gi, 'SECTOR <SECTOR>')
    .replace(/\bLAP\s+\d+\b/gi, 'LAP <LAP>')
    .replace(/\b\d+:\d+(?:\.\d+)?\b/g, '<LAP_TIME>')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectVariableFields(message) {
  return [
    /\bCAR\s+\d+/i.test(message) && 'carNumber',
    /\([^)]{2,4}\)/.test(message) && 'driver',
    /\bTURN\s+\d+/i.test(message) && 'turn',
    /\bSECTOR\s+\d+/i.test(message) && 'sector',
    /\bLAP\s+\d+/i.test(message) && 'lap',
    /\b(?:TIME\s+)?\d+:\d+/i.test(message) && 'time',
  ].filter(Boolean);
}
