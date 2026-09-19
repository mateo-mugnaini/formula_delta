import { useEffect, useState } from 'react';
import { buildBattleComparison } from '../../state/battle.js';
import styles from './BattlePanel.module.css';

export function BattlePanel({ timing, drivers }) {
  const availableIds = Object.keys(timing || {});
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds((current) => {
      const valid = current.filter((id) => availableIds.includes(String(id)));
      return valid.length === 2 ? valid : availableIds.slice(0, 2);
    });
  }, [availableIds.join(',')]);

  const driverIds = selectedIds;
  const rows = buildBattleComparison(timing, drivers, driverIds);

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
            <BattleDriver key={row.id} row={row} />
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

function BattleDriver({ row }) {
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
      <Metric label="Tyre" value={row.tyre?.compound} />
      <Metric label="Tyre age" value={row.tyreAge != null ? `${row.tyreAge} laps` : null} />
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  );
}
