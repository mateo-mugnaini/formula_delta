export function buildStrategyRows(stints = {}, drivers = {}, timing = {}) {
  return Object.entries(stints)
    .filter(([, value]) => Array.isArray(value) && value.length)
    .map(([id, driverStints]) => ({
      id,
      abbreviation: drivers[id]?.abbreviation || id,
      name: drivers[id]?.fullName || drivers[id]?.lastName || id,
      team: drivers[id]?.team?.name || '',
      pitStops: timing[id]?.pitStops ?? 0,
      stints: driverStints.map((stint, index) => ({
        ...stint,
        current: index === driverStints.length - 1,
        width: Math.max(stint.totalLaps ?? 1, 1),
      })),
    }));
}

export function filterStrategyRows(rows = [], selectedDrivers = ['43']) {
  const selected = new Set(selectedDrivers.map(String));
  return rows.filter((row) => selected.has(String(row.id)));
}
