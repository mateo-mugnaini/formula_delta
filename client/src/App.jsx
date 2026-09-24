import { useEffect, useMemo, useState } from 'react';
import styles from './App.module.css';
import { createWebSocketClient } from './websocket/client.js';
import { useFormulaDeltaStore } from './state/store.js';
import { DashboardHeader } from './components/DashboardHeader/DashboardHeader.jsx';
import { TimingTower } from './components/TimingTower/TimingTower.jsx';
import { DashboardPanels } from './components/DashboardPanels/DashboardPanels.jsx';
import { StrategyPanel } from './components/StrategyPanel/StrategyPanel.jsx';
import { BattlePanel } from './components/BattlePanel/BattlePanel.jsx';
import { TeamRadioPanel } from './components/TeamRadioPanel/TeamRadioPanel.jsx';
import { TrackMapPanel } from './components/TrackMapPanel/TrackMapPanel.jsx';
import { useI18n } from './i18n/i18n.js';

export function App() {
  const state = useFormulaDeltaStore();
  const [client, setClient] = useState(null);
  const [delayMs, setDelayMs] = useState(0);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const { t } = useI18n();
  const headerSession = useMemo(
    () => ({ ...state.session, trackStatus: state.track?.status, source: state.source?.mode }),
    [state.session, state.track?.status, state.source?.mode],
  );
  useEffect(() => {
    const client = createWebSocketClient({
      url: import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:3000',
      onState: (next) => useFormulaDeltaStore.setState(next),
      onConnection: (status) => useFormulaDeltaStore.getState().setConnectionStatus(status),
      logger: console,
    });
    setClient(client);
    return () => client.stop();
  }, []);
  useEffect(() => {
    if (selectedDriverId && !state.drivers?.[selectedDriverId]) setSelectedDriverId(null);
  }, [selectedDriverId, state.drivers]);
  useEffect(() => {
    if (Number.isFinite(state.sync?.delayMs) && state.sync.delayMs !== delayMs) setDelayMs(state.sync.delayMs);
  }, [state.sync?.delayMs, delayMs]);
  return (
    <main className={styles.appShell}>
      <DashboardHeader
        session={headerSession}
        connectionStatus={state.connectionStatus}
      />
      <section className={styles.layout}>
        <TimingTower timing={state.timing} stints={state.stints} drivers={state.drivers} selectedDriverId={selectedDriverId} onSelectDriver={setSelectedDriverId} />
        <DashboardPanels state={state} client={client} delayMs={delayMs} setDelayMs={setDelayMs} selectedDriverId={selectedDriverId} onSelectDriver={setSelectedDriverId} />
      </section>
      <section className={styles.strategyBand}>
        <StrategyPanel stints={state.stints} drivers={state.drivers} timing={state.timing} />
      </section>
      <section className={styles.secondaryGrid}>
        <TrackMapPanel title={t.trackMap} message={t.livePositionUnavailable} available={state.capabilities?.livePosition} />
        <BattlePanel timing={state.timing} drivers={state.drivers} gapHistory={state.gapHistory} />
        <TeamRadioPanel messages={state.teamRadio} drivers={state.drivers} />
      </section>
    </main>
  );
}
