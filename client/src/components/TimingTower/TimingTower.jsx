import styles from './TimingTower.module.css';
import { useI18n } from '../../i18n/i18n.js';

export function TimingTower({ timing, drivers }) {
  const { t } = useI18n();
  const rows = Object.entries(timing || {}).sort(
    ([, a], [, b]) => (a.position ?? 999) - (b.position ?? 999),
  );
  return (
    <section className={styles.tower} aria-label="Timing tower">
      <div className={styles.sectionHeading}>
        <h2>{t.timing}</h2>
        <span>{rows.length} drivers</span>
      </div>
      <div className={styles.columnHeader}>
        <span>{t.position}</span>
        <span>{t.driver}</span>
        <span>{t.gap}</span>
        <span>{t.lastLap}</span>
        <span>{t.tyre}</span>
      </div>
      {rows.length ? (
        rows.map(([id, row]) => (
          <div className={styles.row} key={id}>
            <strong>{row.position ?? '—'}</strong>
            <span className={styles.driverCell}>
              <span className={styles.driver}>{drivers?.[id]?.abbreviation || id}</span>
              <small>
                {typeof row.status === 'string' && row.status
                  ? row.status
                  : `INT ${row.intervalToAhead?.display || '—'} · AGE ${row.tyreAge ?? '—'} · PIT ${row.pitStops ?? 0}`}
              </small>
              <small className={styles.sectors}>
                S1 {row.sectors?.[0]?.value?.display || '—'} · S2{' '}
                {row.sectors?.[1]?.value?.display || '—'} · S3{' '}
                {row.sectors?.[2]?.value?.display || '—'}
              </small>
            </span>
            <span>{row.gapToLeader?.display || '—'}</span>
            <span>{row.lastLap?.display || '—'}</span>
            <span className={styles.tyre}>{row.tyre?.compound || '—'}</span>
          </div>
        ))
      ) : (
        <p className={styles.empty}>{t.waitingTiming}</p>
      )}
    </section>
  );
}
