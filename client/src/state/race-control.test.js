import test from 'node:test';
import assert from 'node:assert/strict';
import { translateRaceControlEvent } from './race-control.js';

test('translates common Race Control messages to Spanish', () => {
  const result = translateRaceControlEvent({
    category: 'Other',
    message: 'CAR 12 (ANT) TIME 2:11.790 DELETED - TRACK LIMITS AT TURN 1 LAP 18',
  });
  assert.equal(result.category, 'Otro');
  assert.match(result.message, /Tiempo del coche 12 \(ANT\) eliminado/);
  assert.match(result.message, /curva 1, vuelta 18/);
});

test('translates steward decisions, turn incidents, and clear sectors', () => {
  assert.match(
    translateRaceControlEvent({ message: 'FIA STEWARDS: INCIDENT INVOLVING CAR 10 (GAS) REVIEWED NO FURTHER INVESTIGATION - YELLOW FLAG INFRINGEMENT (13:20:32)' }).message,
    /Comisarios FIA:.*no habrá más investigación.*13:20:32/,
  );
  assert.match(
    translateRaceControlEvent({ message: 'TURN 15 INCIDENT INVOLVING CAR 41 (LIN) NOTED - LEAVING THE TRACK AND GAINING AN ADVANTAGE' }).message,
    /Curva 15:.*salió de pista y obtuvo ventaja/,
  );
  assert.equal(
    translateRaceControlEvent({ message: 'CLEAR IN TRACK SECTOR 15' }).message,
    'Pista despejada en el sector 15',
  );
});
