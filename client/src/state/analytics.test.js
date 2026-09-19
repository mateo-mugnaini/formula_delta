import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAverageLapTime,
  calculateGapTrend,
  calculatePaceDelta,
  estimateDegradation,
} from './analytics.js';

test('calculates average pace from the requested recent lap sample', () => {
  assert.equal(calculateAverageLapTime([90000, 91000, 92000, 93000], 3), 92000);
  assert.equal(calculateAverageLapTime([{ milliseconds: 90000 }, null]), 90000);
  assert.equal(calculateAverageLapTime([]), null);
});

test('classifies derived gap trend with a small stability threshold', () => {
  assert.deepEqual(calculateGapTrend([1000, 1300]), {
    direction: 'widening',
    deltaMilliseconds: 300,
  });
  assert.equal(calculateGapTrend([1000, 1020]).direction, 'stable');
  assert.equal(calculateGapTrend([1000, 700]).direction, 'closing');
});

test('calculates pace delta and degradation estimates from lap samples', () => {
  assert.equal(calculatePaceDelta([90000, 90100, 90200, 91000, 91100, 91200]), 1000);
  assert.equal(estimateDegradation([90000, 90500, 91000]), 500);
  assert.equal(estimateDegradation([90000, 90500]), null);
});
