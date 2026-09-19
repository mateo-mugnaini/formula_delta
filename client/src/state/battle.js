export function buildBattleComparison(timing = {}, drivers = {}, driverIds = []) {
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
      };
    });
}
