import { memo } from 'react';
import {
  calculateAverageLapTime,
  calculatePaceDelta,
  estimateDegradation,
} from '../../state/analytics.js';
import styles from './AnalyticsPanel.module.css';
import { useI18n } from '../../i18n/i18n.js';

export const AnalyticsPanel = memo(function AnalyticsPanel({ timing, drivers, lapHistory }) {
  const { t } = useI18n();
  const rows = Object.entries(lapHistory || {})
    .map(([id, laps]) => ({
      id,
      abbreviation: drivers?.[id]?.abbreviation || id,
      average: calculateAverageLapTime(laps, 3),
      paceDelta: calculatePaceDelta(laps, 3),
      degradation: estimateDegradation(laps),
      position: timing?.[id]?.position,
    }))
    .filter((row) => row.average != null)
    .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));

  return (
    <section className={styles.panel} aria-label="Race analytics">
      <div className={styles.heading}>
        <div>
          <p>{t.derivedData}</p>
          <h2>{t.recentPace}</h2>
        </div>
        <span>last 3 laps</span>
      </div>
      {rows.length ? (
        <div className={styles.rows}>
          {rows.map((row) => (
            <div className={styles.row} key={row.id}>
              <strong>{row.abbreviation}</strong>
              <div className={styles.values}>
                <span>{formatLap(row.average)}</span>
                <small>
                  {formatDelta(row.paceDelta)} · {formatDelta(row.degradation)}/lap
                </small>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>{t.waitingTiming}</p>
      )}
    </section>
  );
});

function formatLap(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = ((milliseconds % 60000) / 1000).toFixed(3).padStart(6, '0');
  return `${minutes}:${seconds}`;
}

function formatDelta(milliseconds) {
  if (milliseconds == null) return '—';
  return `${milliseconds >= 0 ? '+' : ''}${(milliseconds / 1000).toFixed(3)}s`;
}
