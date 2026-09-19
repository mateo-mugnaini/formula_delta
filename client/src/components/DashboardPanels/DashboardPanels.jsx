import { useState } from 'react';
import styles from './DashboardPanels.module.css';
import { useI18n } from '../../i18n/i18n.js';
export function DashboardPanels({ state, client, delayMs, setDelayMs }) {
  const { t } = useI18n();
  const [pendingCommand, setPendingCommand] = useState(null);
  const send = (command, payload = {}) => {
    if (!client || pendingCommand) return;
    setPendingCommand(command);
    client.send({ type: 'COMMAND', command, payload });
    window.setTimeout(() => setPendingCommand(null), 450);
  };
  const activePits = Object.entries(state.timing || {})
    .filter(([, row]) => row.inPit || row.pitLane)
    .slice(0, 4);
  return (
    <aside className={styles.rail}>
      <Panel title={t.raceControl}>
        {state.raceControl?.length ? (
          <div className={styles.messages}>
            {state.raceControl
              .slice(-4)
              .reverse()
              .map((event) => (
                <p key={event.id}>
                  <strong>{event.category || t.event}</strong>
                  <span>{event.message}</span>
                </p>
              ))}
          </div>
        ) : (
          <Empty text={t.noRecentMessages} />
        )}
      </Panel>
      <Panel title={t.pitActivity}>
        {activePits.length ? (
          activePits.map(([id, row]) => (
            <p className={styles.pitRow} key={id}>
              <strong>{state.drivers?.[id]?.abbreviation || id}</strong>
              <span>{row.inPit ? t.inPit : t.pitLane}</span>
            </p>
          ))
        ) : (
          <Empty text={t.noActivePitEvents} />
        )}
      </Panel>
      <Panel title={t.weather}>
        <div className={styles.weather}>
          <Metric label="Air" value={state.weather?.airTemperature} suffix="°C" />
          <Metric label="Track" value={state.weather?.trackTemperature} suffix="°C" />
          <Metric label="Rain" value={state.weather?.rainfall} />
        </div>
      </Panel>
      {state.source?.mode === 'replay' && (
        <Panel title={t.replay}>
          <div className={styles.replay}>
            <span>
              {state.replay?.status || 'idle'} · {state.replay?.speed || 1}x
            </span>
            <div>
              <button disabled={pendingCommand !== null} onClick={() => send('REPLAY_PLAY')}>
                {pendingCommand === 'REPLAY_PLAY' ? 'Sending…' : 'Play'}
              </button>
              <button disabled={pendingCommand !== null} onClick={() => send('REPLAY_PAUSE')}>
                {pendingCommand === 'REPLAY_PAUSE' ? 'Sending…' : 'Pause'}
              </button>
              <button disabled={pendingCommand !== null} onClick={() => send('REPLAY_RESTART')}>
                {pendingCommand === 'REPLAY_RESTART' ? 'Sending…' : 'Restart'}
              </button>
            </div>
          </div>
        </Panel>
      )}
      <Panel title={t.capabilities}>
        <div className={styles.capabilities}>
          {[
            'timing',
            'tyres',
            'weather',
            'raceControl',
            'teamRadio',
            'carTelemetry',
            'livePosition',
          ].map((name) => (
            <span
              className={state.capabilities?.[name] ? styles.available : styles.unavailable}
              key={name}
            >
              <i />
              {name}
            </span>
          ))}
        </div>
      </Panel>
      <Panel title={t.broadcastDelay}>
        <div className={styles.delayControl}>
          <label htmlFor="delay">{t.delaySeconds}</label>
          <div>
            <input
              id="delay"
              type="number"
              min="0"
              max="86400"
              step="1"
              value={delayMs / 1000}
              onChange={(event) => setDelayMs(Number(event.target.value) * 1000)}
            />
            <button
              disabled={pendingCommand !== null}
              onClick={() => send('SYNC_SET_DELAY', { delayMs })}
            >
              {pendingCommand === 'SYNC_SET_DELAY' ? t.applying : t.apply}
            </button>
          </div>
        </div>
      </Panel>
    </aside>
  );
}
function Panel({ title, children }) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeading}>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
function Empty({ text }) {
  return <p className={styles.empty}>{text}</p>;
}
function Metric({ label, value, suffix = '' }) {
  return (
    <div>
      <span>{label}</span>
      <strong>
        {value ?? '—'}
        {value != null && suffix}
      </strong>
    </div>
  );
}
