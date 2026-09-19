export function buildStrategyRows(stints = {}, drivers = {}, timing = {}) {
  return Object.entries(stints)
    .filter(([, value]) => Array.isArray(value) && value.length)
    .map(([id, driverStints]) => ({
      id,
      abbreviation: drivers[id]?.abbreviation || id,
      pitStops: timing[id]?.pitStops ?? 0,
      stints: driverStints.map((stint, index) => ({
        ...stint,
        current: index === driverStints.length - 1,
        width: Math.max(stint.totalLaps ?? 1, 1),
      })),
    }));
}
