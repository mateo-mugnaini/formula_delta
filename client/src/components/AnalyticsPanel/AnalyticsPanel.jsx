import { calculateAverageLapTime } from '../../state/analytics.js';
import styles from './AnalyticsPanel.module.css';

export function AnalyticsPanel({ timing, drivers, lapHistory }) {
  const rows = Object.entries(lapHistory || {})
    .map(([id, laps]) => ({
      id,
      abbreviation: drivers?.[id]?.abbreviation || id,
      average: calculateAverageLapTime(laps, 3),
      position: timing?.[id]?.position,
    }))
    .filter((row) => row.average != null)
    .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));

  return (
    <section className={styles.panel} aria-label="Race analytics">
      <div className={styles.heading}>
        <div>
          <p>DERIVED DATA</p>
          <h2>Recent pace</h2>
        </div>
        <span>last 3 laps</span>
      </div>
      {rows.length ? (
        <div className={styles.rows}>
          {rows.map((row) => (
            <div className={styles.row} key={row.id}>
              <strong>{row.abbreviation}</strong>
              <span>{formatLap(row.average)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Waiting for lap samples</p>
      )}
    </section>
  );
}

function formatLap(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = ((milliseconds % 60000) / 1000).toFixed(3).padStart(6, '0');
  return `${minutes}:${seconds}`;
}
