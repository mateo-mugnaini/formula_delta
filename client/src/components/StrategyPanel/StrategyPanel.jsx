import styles from './StrategyPanel.module.css';

export function StrategyPanel({ stints, drivers }) {
  const entries = Object.entries(stints || {}).filter(
    ([, value]) => Array.isArray(value) && value.length,
  );
  return (
    <section className={styles.panel} aria-label="Strategy view">
      <div className={styles.heading}>
        <h2>Strategy</h2>
        <span>{entries.length} drivers</span>
      </div>
      {entries.length ? (
        <div className={styles.rows}>
          {entries.map(([id, driverStints]) => (
            <div className={styles.row} key={id}>
              <strong>{drivers?.[id]?.abbreviation || id}</strong>
              <div className={styles.stints}>
                {driverStints.map((stint) => (
                  <span
                    className={styles.stint}
                    key={stint.id}
                    title={`${stint.compound} · ${stint.totalLaps ?? '—'} laps`}
                  >
                    <b>{stint.compound}</b>
                    <small>{stint.totalLaps ?? '—'}L</small>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Waiting for stint data</p>
      )}
    </section>
  );
}
