import { memo, useMemo } from 'react';
import styles from './StrategyPanel.module.css';
import { buildStrategyRows } from '../../state/strategy.js';
import { useI18n } from '../../i18n/i18n.js';

export const StrategyPanel = memo(function StrategyPanel({ stints, drivers, timing }) {
  const { t } = useI18n();
  const rows = useMemo(() => buildStrategyRows(stints, drivers, timing), [stints, drivers, timing]);
  return (
    <section className={styles.panel} aria-label="Strategy view">
      <div className={styles.heading}>
        <h2>Strategy</h2>
        <span>{rows.length} drivers</span>
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
