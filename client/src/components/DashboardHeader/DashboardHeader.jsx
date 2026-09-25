import { memo, useEffect, useState } from 'react';
import styles from './DashboardHeader.module.css';
import { supportedLanguages, useI18n } from '../../i18n/i18n.js';
import { TrackFlag } from '../TrackFlag/TrackFlag.jsx';
export const DashboardHeader = memo(function DashboardHeader({ session, connectionStatus }) {
  const { language, setLanguage, t } = useI18n();
  const [lightTheme, setLightTheme] = useState(() => localStorage.getItem('formula-delta-theme') === 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = lightTheme ? 'light' : 'dark';
    localStorage.setItem('formula-delta-theme', lightTheme ? 'light' : 'dark');
  }, [lightTheme]);
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
          <button type="button" className={styles.themeSwitch} aria-pressed={lightTheme} aria-label={lightTheme ? t.darkMode : t.lightMode} title={lightTheme ? t.darkMode : t.lightMode} onClick={() => setLightTheme((value) => !value)}>
            <span aria-hidden="true">{lightTheme ? '☾' : '☀'}</span>
            {lightTheme ? t.darkMode : t.lightMode}
          </button>
        </div>
      </header>
      <div className={styles.statusBar}>
        <span>{session?.meeting?.name || session?.name || t.formulaSession}</span>
        <span>{session?.meeting?.circuit?.shortName || '—'}</span>
        <TrackFlag status={session?.trackStatus} code={session?.trackCode} />
        <strong className={styles.trackStatus}>{session?.trackStatus || t.trackStatusUnknown}</strong>
        <span>{session?.type || t.formulaSession}</span>
        <span>{session?.currentLap != null ? `${t.lapOf} ${session.currentLap}/${session.totalLaps || '—'}` : t.sessionReady}</span>
        <span>{session?.source || 'unknown'} source</span>
      </div>
    </>
  );
});
