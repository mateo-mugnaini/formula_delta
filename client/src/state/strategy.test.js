import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategyRows } from './strategy.js';

test('builds strategy rows with driver metadata and current stint', () => {
  const rows = buildStrategyRows(
    {
      10: [
        { id: '10:0', compound: 'MEDIUM', totalLaps: 20 },
        { id: '10:1', compound: 'HARD' },
      ],
    },
    { 10: { abbreviation: 'GAS' } },
    { 10: { pitStops: 1 } },
  );
  assert.equal(rows[0].abbreviation, 'GAS');
  assert.equal(rows[0].pitStops, 1);
  assert.equal(rows[0].stints[1].current, true);
  assert.equal(rows[0].stints[0].width, 20);
});
