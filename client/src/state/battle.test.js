import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBattleComparison } from './battle.js';

test('builds a focused comparison for at most two drivers', () => {
  const result = buildBattleComparison(
    {
      12: {
        position: 1,
        gapToLeader: { display: '—' },
        lastLap: { display: '1:36.030' },
        tyre: { compound: 'SOFT' },
        tyreAge: 4,
      },
    },
    { 12: { abbreviation: 'COL' } },
    [12, 10, 1],
    { 12: [1000, 1300] },
  );

  assert.equal(result.length, 2);
  assert.equal(result[0].abbreviation, 'COL');
  assert.equal(result[0].lastLap.display, '1:36.030');
  assert.equal(result[0].gapTrend, 'widening');
  assert.equal(result[1].abbreviation, 10);
  assert.equal(result[1].lastLap, null);
});
