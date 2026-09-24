import { memo, useMemo, useState } from 'react';
import styles from './StrategyPanel.module.css';
import { buildStrategyRows, filterStrategyRows } from '../../state/strategy.js';
import { useI18n } from '../../i18n/i18n.js';

export const StrategyPanel = memo(function StrategyPanel({ stints, drivers, timing }) {
  const { t } = useI18n();
  const availableDrivers = useMemo(() => Object.keys(stints || {}), [stints]);
  const [selectedDrivers, setSelectedDrivers] = useState(['43']);
  const rows = useMemo(
    () => filterStrategyRows(buildStrategyRows(stints, drivers, timing), selectedDrivers),
    [stints, drivers, timing, selectedDrivers],
  );
  return (
    <section className={styles.panel} aria-label="Strategy view">
      <div className={styles.heading}>
        <div><p className={styles.eyebrow}>{t.strategy || 'TYRE STRATEGY'}</p><h2>{t.strategy || 'Strategy'}</h2></div>
        <span>{selectedDrivers.length} selected</span>
      </div>
      <div className={styles.driverFilters} aria-label="Strategy driver selection">
        {availableDrivers.map((id) => (
          <button
            type="button"
            key={id}
            className={selectedDrivers.includes(id) ? styles.selectedDriver : undefined}
            aria-pressed={selectedDrivers.includes(id)}
            onClick={() => setSelectedDrivers((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])}
          >
            {drivers?.[id]?.abbreviation || id}
          </button>
        ))}
      </div>
      <div className={styles.legend} aria-label="Tyre compound legend">
        <span><i className={styles.soft} /> SOFT</span>
        <span><i className={styles.medium} /> MEDIUM</span>
        <span><i className={styles.hard} /> HARD</span>
        <span><i className={styles.intermediate} /> INTER</span>
        <span><i className={styles.wet} /> WET</span>
      </div>
      {rows.length ? (
        <div className={styles.rows}>
          {rows.map((row) => (
            <StrategyRow key={row.id} row={row} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>{t.waitingStints}</p>
      )}
    </section>
  );
});

function StrategyRow({ row }) {
  return (
    <div className={styles.row}>
      <div className={styles.driver}>
        <strong>{row.abbreviation}</strong>
        <small title={row.name}>{row.team || row.name}</small>
        <small>{row.pitStops} stops</small>
      </div>
      <div className={styles.stints}>
        {row.stints.map((stint) => (
          <span
            className={`${styles.stint} ${styles[getCompoundClass(stint.compound)]} ${stint.current ? styles.current : ''}`}
            style={{ flex: stint.width }}
            key={stint.id}
            title={`${stint.compound} · ${stint.totalLaps ?? '—'} laps`}
          >
            <b>{stint.compound}</b>
            <small>{stint.totalLaps ?? '—'}L</small>
            {stint.lapNumber != null && <em>L{stint.lapNumber}</em>}
            {stint.current && <i>NOW</i>}
          </span>
        ))}
      </div>
    </div>
  );
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
