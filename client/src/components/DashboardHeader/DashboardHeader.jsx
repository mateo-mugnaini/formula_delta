import styles from './DashboardHeader.module.css';
import { supportedLanguages, useI18n } from '../../i18n/i18n.js';
export function DashboardHeader({ session, connectionStatus }) {
  const { language, setLanguage, t } = useI18n();
  return (
    <>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>FORMULA DELTA</p>
          <h1>{session?.name || t.liveTiming}</h1>
        </div>
        <div className={styles.headerMeta}>
          <span>{session?.currentLap ? `LAP ${session.currentLap}` : t.sessionReady}</span>
          <span
            className={`${styles.connection} ${connectionStatus === 'connected' ? styles.connected : ''}`}
          >
            <i />
            {t[connectionStatus] || connectionStatus}
          </span>
          <label className={styles.language}>
            <span className={styles.visuallyHidden}>Language</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              {supportedLanguages.map((option) => (
                <option value={option.code} key={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div className={styles.statusBar}>
        <strong className={styles.trackStatus}>
          {session?.trackStatus || t.trackStatusUnknown}
        </strong>
        <span>{session?.type || t.formulaSession}</span>
        <span>{session?.source || 'unknown'} source</span>
      </div>
    </>
  );
}
