export const capabilityNames = [
  'timing',
  'tyres',
  'weather',
  'raceControl',
  'teamRadio',
  'carTelemetry',
  'livePosition'
];

export function createCapabilities(overrides = {}) {
  return Object.fromEntries(capabilityNames.map((name) => [name, overrides[name] === true]));
}
