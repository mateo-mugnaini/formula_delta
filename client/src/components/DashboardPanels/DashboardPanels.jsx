import { memo, useState } from 'react';
import styles from './DashboardPanels.module.css';
import { useI18n } from '../../i18n/i18n.js';
export const DashboardPanels = memo(function DashboardPanels({ state, client, delayMs, setDelayMs, selectedDriverId, onSelectDriver }) {
  const { t } = useI18n();
  const [pendingCommand, setPendingCommand] = useState(null);
  const send = (command, payload = {}) => {
    if (!client || pendingCommand) return;
    setPendingCommand(command);
    client.send({ type: 'COMMAND', command, payload });
    window.setTimeout(() => setPendingCommand(null), 450);
  };
  const activePits = Object.entries(state.timing || {})
    .filter(([, row]) => row.inPit || row.pitLane || row.status?.inPit || row.status?.pitOut)
    .slice(0, 4);
  const focusedStints = selectedDriverId ? state.stints?.[selectedDriverId] || [] : [];
  const currentStint = focusedStints.at(-1);
  return (
    <aside className={styles.rail}>
      <Panel title={t.driverFocus}>
        {selectedDriverId ? (
          <div className={styles.focusGrid}>
            <strong>{state.drivers?.[selectedDriverId]?.fullName || selectedDriverId}</strong>
            <button onClick={() => onSelectDriver?.(null)}>{t.clear}</button>
            <span>{t.team} {state.drivers?.[selectedDriverId]?.team?.name || '—'}</span>
            <span>STINT {currentStint?.number ?? '—'}</span>
            <span>COMPOUND {currentStint?.compound || '—'}</span>
            <span>LAPS {currentStint?.totalLaps ?? '—'}</span>
            <span>STATUS {getFocusStatus(state.timing?.[selectedDriverId])}</span>
            <span>{t.interval} {state.timing?.[selectedDriverId]?.intervalToAhead?.display || '—'}</span>
            <span>{t.bestLap} {state.timing?.[selectedDriverId]?.bestLap?.display || '—'}</span>
            <span>{t.tyreAge} {state.timing?.[selectedDriverId]?.tyreAge ?? '—'}</span>
            <span>{t.stops} {state.timing?.[selectedDriverId]?.pitStops ?? 0}</span>
            <span>Position {state.timing?.[selectedDriverId]?.position ?? '—'}</span>
            <span>Gap {state.timing?.[selectedDriverId]?.gapToLeader?.display || '—'}</span>
            <span>Last lap {state.timing?.[selectedDriverId]?.lastLap?.display || '—'}</span>
            <span>Tyre {state.timing?.[selectedDriverId]?.tyre?.compound || '—'}</span>
          </div>
        ) : <Empty text={t.selectDriver} />}
      </Panel>
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
              {[0.5, 1, 2, 5, 10].map((speed) => (
                <button key={speed} disabled={pendingCommand !== null} onClick={() => send('REPLAY_SET_SPEED', { speed })}>{speed}x</button>
              ))}
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
            <button disabled={pendingCommand !== null} onClick={() => send('SYNC_ADJUST_DELAY', { deltaMs: -1000 })}>-1s</button>
            <button disabled={pendingCommand !== null} onClick={() => send('SYNC_ADJUST_DELAY', { deltaMs: 1000 })}>+1s</button>
          </div>
        </div>
      </Panel>
    </aside>
  );
}, areDashboardPanelsEqual);

function areDashboardPanelsEqual(previous, next) {
  if (previous.client !== next.client || previous.delayMs !== next.delayMs || previous.selectedDriverId !== next.selectedDriverId) return false;
  const previousState = previous.state;
  const nextState = next.state;
  return previousState.timing === nextState.timing && previousState.stints === nextState.stints && previousState.drivers === nextState.drivers && previousState.raceControl === nextState.raceControl && previousState.weather === nextState.weather && previousState.source === nextState.source && previousState.replay === nextState.replay && previousState.capabilities === nextState.capabilities;
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
function getFocusStatus(timing = {}) {
  if (timing.inPit || timing.status?.inPit) return 'PIT';
  if (timing.pitLane || timing.status?.pitOut) return 'PIT LANE';
  if (timing.status?.stopped) return 'STOPPED';
  return 'RUNNING';
}
