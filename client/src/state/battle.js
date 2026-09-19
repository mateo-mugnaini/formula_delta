export function buildBattleComparison(timing = {}, drivers = {}, driverIds = [], gapHistory = {}) {
  return driverIds
    .filter((id) => id != null)
    .slice(0, 2)
    .map((id) => {
      const row = timing[id] ?? {};
      const driver = drivers[id] ?? {};
      return {
        id,
        abbreviation: driver.abbreviation || id,
        position: row.position ?? null,
        gap: row.gapToLeader ?? null,
        interval: row.intervalToAhead ?? null,
        lastLap: row.lastLap ?? null,
        bestLap: row.bestLap ?? null,
        sectors: row.sectors ?? [],
        tyre: row.tyre ?? null,
        tyreAge: row.tyreAge ?? null,
        recentPace: row.recentPace ?? null,
        gapTrend: getGapTrend(gapHistory[id]),
      };
    });
}

function getGapTrend(history = []) {
  if (history.length < 2) return 'stable';
  const change = history.at(-1) - history[0];
  if (Math.abs(change) < 50) return 'stable';
  return change > 0 ? 'widening' : 'closing';
}
