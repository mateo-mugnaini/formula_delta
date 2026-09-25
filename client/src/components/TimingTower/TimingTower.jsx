import { memo, useEffect, useMemo, useRef, useState } from 'react';
import styles from './TimingTower.module.css';
import { useI18n } from '../../i18n/i18n.js';

export const TimingTower = memo(function TimingTower({ timing, stints, drivers, selectedDriverId, onSelectDriver }) {
  const { t } = useI18n();
  const [visibleColumns, setVisibleColumns] = useState(() => new Set(['gap', 'interval', 'lastLap', 'tyre', 'age', 'stops', 'box', 'mini']));
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
        <div className={styles.towerActions}>
          <ColumnVisibility columns={visibleColumns} onChange={setVisibleColumns} />
          <span className={styles.rowCount}>{rows.length} drivers</span>
        </div>
      </div>
      <div className={styles.tableViewport}>
      <div className={styles.columnHeader} style={{ gridTemplateColumns: getGridTemplate(visibleColumns) }}>
        <span>{t.position}</span><span>{t.driver}</span>{visibleColumns.has('mini') && <span>MINI</span>}
        {visibleColumns.has('gap') && <span>{t.gap}</span>}{visibleColumns.has('interval') && <span>{t.interval}</span>}
        {visibleColumns.has('lastLap') && <span>{t.lastLap}</span>}{visibleColumns.has('tyre') && <span>{t.tyre}</span>}
        {visibleColumns.has('age') && <span>{t.tyreAge}</span>}{visibleColumns.has('stops') && <span>{t.stops}</span>}{visibleColumns.has('box') && <span>BOX</span>}
      </div>
      {rows.length ? rows.map(([id, row]) => {
        const driver = drivers?.[id] || {};
        const currentStint = stints?.[id]?.at(-1);
        const selected = String(selectedDriverId) === id;
        const status = getDriverStatus(row, t);
        return (
          <div
            className={`${styles.row} ${changedDrivers.has(id) ? styles.positionChanged : ''}`}
            style={{ gridTemplateColumns: getGridTemplate(visibleColumns) }}
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
              <span className={styles.driver}><b>{driver.racingNumber || id}</b>{driver.abbreviation || id}</span>
              <small>{driver.team?.name || status}</small>
              <small className={styles.sectors}>S1 {row.sectors?.[0]?.value?.display || '—'} · S2 {row.sectors?.[1]?.value?.display || '—'} · S3 {row.sectors?.[2]?.value?.display || '—'}</small>
            </span>
            {visibleColumns.has('mini') && <MiniSectorStrip sectors={row.sectors} />}
            {visibleColumns.has('gap') && <span>{row.gapToLeader?.display || '—'}</span>}
            {visibleColumns.has('interval') && <span>{row.intervalToAhead?.display || '—'}</span>}
            {visibleColumns.has('lastLap') && <span>{row.lastLap?.display || '—'}</span>}
            {visibleColumns.has('tyre') && <span className={`${styles.tyre} ${styles[getCompoundClass(row.tyre?.compound || currentStint?.compound)]}`}>{row.tyre?.compound || currentStint?.compound || '—'}</span>}
            {visibleColumns.has('age') && <span>{row.tyreAge ?? currentStint?.lapNumber ?? '—'}</span>}
            {visibleColumns.has('stops') && <span>{row.pitStops ?? 0}</span>}
            {visibleColumns.has('box') && <PitSignal inPit={Boolean(row.inPit || row.pitLane || row.status?.inPit || row.status?.pitOut)} />}
          </div>
        );
      }) : <p className={styles.empty}>{t.waitingTiming}</p>}
      </div>
    </section>
  );
});

const columnOptions = [['mini', 'Mini'], ['gap', 'Gap'], ['interval', 'Interval'], ['lastLap', 'Last lap'], ['tyre', 'Tyre'], ['age', 'Age'], ['stops', 'Stops'], ['box', 'Box']];
function ColumnVisibility({ columns, onChange }) {
  const [open, setOpen] = useState(false);
  return <div className={styles.columnVisibility}>
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>Columns</button>
    {open && <div className={styles.columnMenu} role="group" aria-label="Visible timing columns">
      {columnOptions.map(([key, label]) => <label key={key}><input type="checkbox" checked={columns.has(key)} onChange={() => onChange((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; })} />{label}</label>)}
    </div>}
  </div>;
}
function getGridTemplate(columns) {
  return ['2.25rem', 'minmax(6.5rem, 1.6fr)', columns.has('mini') && 'minmax(2.5rem, .7fr)', columns.has('gap') && 'minmax(3.5rem, .8fr)', columns.has('interval') && 'minmax(3.5rem, .9fr)', columns.has('lastLap') && 'minmax(4.5rem, 1fr)', columns.has('tyre') && 'minmax(3.5rem, .8fr)', columns.has('age') && '2.5rem', columns.has('stops') && '2.75rem', columns.has('box') && '3rem'].filter(Boolean).join(' ');
}

function getDriverStatus(row, t) {
  if (row.inPit || row.status?.inPit) return t.inPit;
  if (row.pitLane || row.status?.pitOut) return t.pitLane;
  if (row.status?.stopped) return 'STOPPED';
  return '';
}

function PitSignal({ inPit }) {
  return (
    <span className={`${styles.pitSignal} ${inPit ? styles.pitActive : styles.pitInactive}`} role="img" aria-label={inPit ? 'Driver in pit lane' : 'Driver on track'} title={inPit ? 'IN BOX' : 'ON TRACK'}>
      <i />
      <small>{inPit ? 'IN' : 'OUT'}</small>
    </span>
  );
}

function MiniSectorStrip({ sectors = [] }) {
  const segments = sectors.flatMap((sector, sectorIndex) => {
    const source = Array.isArray(sector?.segments) ? sector.segments : Object.values(sector?.segments || {});
    return source.map((segment, index) => ({ segment, key: `${sectorIndex}-${index}` }));
  });
  if (!segments.length) return <span className={styles.miniUnavailable} title="Mini-sectors unavailable">—</span>;
  return <span className={styles.miniSectors} aria-label="Mini-sector status">{segments.map(({ segment, key }) => <i className={styles[getMiniSectorClass(segment)]} key={key} title={getMiniSectorLabel(segment)} />)}</span>;
}

function getMiniSectorClass(segment = {}) {
  const status = String(segment.Status ?? segment.status ?? '').toLowerCase();
  if (segment.OverallFastest || segment.overallFastest) return 'sessionBest';
  if (segment.PersonalFastest || segment.personalFastest) return 'personalBest';
  if (segment.Invalid || segment.invalid) return 'invalid';
  if (status === 'pit' || status === 'inpit' || status === 'pitlane') return 'pit';
  if (status === 'invalid' || status === 'red') return 'invalid';
  if (status === 'purple' || status === 'sessionbest') return 'sessionBest';
  if (status === 'green' || status === 'personalbest') return 'personalBest';
  return 'normal';
}

function getMiniSectorLabel(segment = {}) {
  return { sessionBest: 'Session best', personalBest: 'Personal best', invalid: 'Invalid', pit: 'Pit', normal: 'Normal' }[getMiniSectorClass(segment)];
}

function getCompoundClass(compound = '') {
  const normalized = compound.toLowerCase();
  if (normalized.includes('soft')) return 'soft';
  if (normalized.includes('medium')) return 'medium';
  if (normalized.includes('hard')) return 'hard';
  if (normalized.includes('inter')) return 'intermediate';
  if (normalized.includes('wet')) return 'wet';
  return 'unknownCompound';
}
