import styles from './DashboardHeader.module.css';
export function DashboardHeader({ session, connectionStatus }) {
  return (
    <>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>FORMULA DELTA</p>
          <h1>{session?.name || 'Live timing'}</h1>
        </div>
        <div className={styles.headerMeta}>
          <span>{session?.currentLap ? `LAP ${session.currentLap}` : 'SESSION READY'}</span>
          <span
            className={`${styles.connection} ${connectionStatus === 'connected' ? styles.connected : ''}`}
          >
            <i />
            {connectionStatus}
          </span>
        </div>
      </header>
      <div className={styles.statusBar}>
        <strong className={styles.trackStatus}>
          {session?.trackStatus || 'TRACK STATUS UNKNOWN'}
        </strong>
        <span>{session?.type || 'Formula 1 session'}</span>
        <span>{session?.source || 'unknown'} source</span>
      </div>
    </>
  );
}
