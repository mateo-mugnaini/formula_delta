import { useEffect, useState } from 'react';
import { buildBattleComparison } from '../../state/battle.js';
import styles from './BattlePanel.module.css';

export function BattlePanel({ timing, drivers, gapHistory }) {
  const availableIds = Object.keys(timing || {});
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds((current) => {
      const valid = current.filter((id) => availableIds.includes(String(id)));
      return valid.length === 2 ? valid : availableIds.slice(0, 2);
    });
  }, [availableIds.join(',')]);

  const driverIds = selectedIds;
  const rows = buildBattleComparison(timing, drivers, driverIds, gapHistory);

  return (
    <section className={styles.panel} aria-label="Battle mode">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>BATTLE MODE</p>
          <h2>Driver comparison</h2>
        </div>
        <span>{rows.length}/2 selected</span>
      </div>
      <div className={styles.selectors}>
        <DriverSelect
          label="Driver A"
          value={selectedIds[0] ?? ''}
          options={availableIds}
          onChange={(value) => setSelectedIds([value, selectedIds[1]].filter(Boolean))}
        />
        <DriverSelect
          label="Driver B"
          value={selectedIds[1] ?? ''}
          options={availableIds}
          onChange={(value) => setSelectedIds([selectedIds[0], value].filter(Boolean))}
        />
      </div>
      {rows.length ? (
        <div className={styles.grid}>
          {rows.map((row) => (
            <BattleDriver key={row.id} row={row} history={gapHistory?.[row.id]} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Waiting for two timing entries</p>
      )}
    </section>
  );
}

function DriverSelect({ label, value, options, onChange }) {
  return (
    <label className={styles.selector}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {options.map((id) => (
          <option value={id} key={id}>
            {id}
          </option>
        ))}
      </select>
    </label>
  );
}

function BattleDriver({ row, history = [] }) {
  return (
    <article className={styles.driver}>
      <div className={styles.driverHeading}>
        <strong>{row.abbreviation}</strong>
        <span>P{row.position ?? '—'}</span>
      </div>
      <Metric label="Gap" value={row.gap?.display} />
      <Metric label="Interval" value={row.interval?.display} />
      <Metric label="Last lap" value={row.lastLap?.display} />
      <Metric label="Best lap" value={row.bestLap?.display} />
      <Metric label="Sectors" value={formatSectors(row.sectors)} />
      <Metric label="Tyre" value={row.tyre?.compound} />
      <Metric label="Tyre age" value={row.tyreAge != null ? `${row.tyreAge} laps` : null} />
      <Metric label="Recent pace" value={row.recentPace?.display} derived />
      <Metric label="Gap trend" value={row.gapTrend} derived />
      <GapHistory values={history} />
    </article>
  );
}

function formatSectors(sectors = []) {
  const values = sectors.map((sector) => sector?.value?.display).filter(Boolean);
  return values.length ? values.join(' · ') : null;
}

function GapHistory({ values }) {
  return (
    <div className={styles.history}>
      <span>Gap history</span>
      <div className={styles.historyTrack} aria-label="Gap history">
        {values.length ? (
          values.map((value, index) => (
            <i style={{ height: `${Math.min(value / 20, 100)}%` }} key={`${value}-${index}`} />
          ))
        ) : (
          <em>—</em>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, derived = false }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong className={derived ? styles.derived : undefined}>{value || '—'}</strong>
    </div>
  );
}
