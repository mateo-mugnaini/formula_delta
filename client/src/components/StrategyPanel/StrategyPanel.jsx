import styles from './StrategyPanel.module.css';
import { buildStrategyRows } from '../../state/strategy.js';

export function StrategyPanel({ stints, drivers, timing }) {
  const rows = buildStrategyRows(stints, drivers, timing);
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
        <p className={styles.empty}>Waiting for stint data</p>
      )}
    </section>
  );
}

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
            className={`${styles.stint} ${stint.current ? styles.current : ''}`}
            style={{ flex: stint.width }}
            key={stint.id}
            title={`${stint.compound} · ${stint.totalLaps ?? '—'} laps`}
          >
            <b>{stint.compound}</b>
            <small>{stint.totalLaps ?? '—'}L</small>
            {stint.lapNumber != null && <em>L{stint.lapNumber}</em>}
          </span>
        ))}
      </div>
    </div>
  );
}
