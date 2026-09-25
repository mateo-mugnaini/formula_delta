import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMessageTemplate } from './race-control-catalog.js';

test('groups variable Race Control values into one glossary template', () => {
  assert.equal(
    normalizeMessageTemplate('CAR 12 (ANT) TIME 2:11.790 DELETED - TRACK LIMITS AT TURN 1 LAP 18'),
    'CAR <NUMBER> (<DRIVER>) TIME <LAP_TIME> DELETED - TRACK LIMITS AT TURN <TURN> LAP <LAP>',
  );
  assert.equal(
    normalizeMessageTemplate('CLEAR IN TRACK SECTOR 15'),
    'CLEAR IN TRACK SECTOR <SECTOR>',
  );
});
