import styles from './TrackMapPanel.module.css';

export function TrackMapPanel({ available = false, title, message }) {
  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.heading}><h2>{title}</h2><span>{available ? 'LIVE' : 'UNAVAILABLE'}</span></div>
      <div className={styles.empty} aria-live="polite">
        <strong>{available ? 'Posiciones en pista disponibles' : message}</strong>
        <span>{available ? 'La capa visual de posiciones está lista para integrarse.' : 'El feed actual no proporciona posiciones normalizadas de los coches.'}</span>
      </div>
    </section>
  );
}
