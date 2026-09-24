import { memo, useEffect, useMemo, useRef, useState } from 'react';
import styles from './TimingTower.module.css';
import { useI18n } from '../../i18n/i18n.js';

export const TimingTower = memo(function TimingTower({ timing, stints, drivers, selectedDriverId, onSelectDriver }) {
  const { t } = useI18n();
  const previousPositions = useRef({});
  const [changedDrivers, setChangedDrivers] = useState(new Set());
  const rows = useMemo(
    () => Object.entries(timing || {}).sort(([, a], [, b]) => (a.position ?? 999) - (b.position ?? 999)),
    [timing],
  );

  useEffect(() => {
    const changed = new Set();
    for (const [id, row] of rows) {
      if (previousPositions.current[id] !== undefined && previousPositions.current[id] !== row.position) changed.add(id);
    }
    previousPositions.current = Object.fromEntries(rows.map(([id, row]) => [id, row.position]));
    if (!changed.size) return undefined;
    setChangedDrivers(changed);
    const timer = setTimeout(() => setChangedDrivers(new Set()), 700);
    return () => clearTimeout(timer);
  }, [rows]);

  return (
    <section className={styles.tower} aria-label="Timing tower">
      <div className={styles.sectionHeading}>
        <div><p className={styles.eyebrow}>LIVE CLASSIFICATION</p><h2>{t.timing}</h2></div>
        <span>{rows.length} drivers</span>
      </div>
      <div className={styles.columnHeader}>
        <span>{t.position}</span><span>{t.driver}</span><span>{t.gap}</span><span>{t.interval}</span>
        <span>{t.lastLap}</span><span>{t.tyre}</span><span>{t.tyreAge}</span><span>{t.stops}</span>
      </div>
      {rows.length ? rows.map(([id, row]) => {
        const driver = drivers?.[id] || {};
        const currentStint = stints?.[id]?.at(-1);
        const selected = String(selectedDriverId) === id;
        const status = getDriverStatus(row, t);
        return (
          <div
            className={`${styles.row} ${changedDrivers.has(id) ? styles.positionChanged : ''}`}
            key={id}
            role="button"
            tabIndex="0"
            aria-pressed={selected}
            onClick={() => onSelectDriver?.(id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectDriver?.(id);
              }
            }}
          >
            <strong>{row.position ?? '—'}</strong>
            <span className={styles.driverCell}>
              <span className={styles.driver}>{driver.abbreviation || id}</span>
              <small>{driver.team?.name || status}</small>
              <small className={styles.sectors}>S1 {row.sectors?.[0]?.value?.display || '—'} · S2 {row.sectors?.[1]?.value?.display || '—'} · S3 {row.sectors?.[2]?.value?.display || '—'}</small>
            </span>
            <span>{row.gapToLeader?.display || '—'}</span>
            <span>{row.intervalToAhead?.display || '—'}</span>
            <span>{row.lastLap?.display || '—'}</span>
            <span className={styles.tyre}>{row.tyre?.compound || currentStint?.compound || '—'}</span>
            <span>{row.tyreAge ?? currentStint?.lapNumber ?? '—'}</span>
            <span>{row.pitStops ?? 0}</span>
          </div>
        );
      }) : <p className={styles.empty}>{t.waitingTiming}</p>}
    </section>
  );
});

function getDriverStatus(row, t) {
  if (row.inPit || row.status?.inPit) return t.inPit;
  if (row.pitLane || row.status?.pitOut) return t.pitLane;
  if (row.status?.stopped) return 'STOPPED';
  return '';
}
