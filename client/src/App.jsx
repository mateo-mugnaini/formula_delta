import { useEffect, useState } from 'react';
import styles from './App.module.css';
import { createWebSocketClient } from './websocket/client.js';
import { useFormulaDeltaStore } from './state/store.js';
import { DashboardHeader } from './components/DashboardHeader/DashboardHeader.jsx';
import { TimingTower } from './components/TimingTower/TimingTower.jsx';
import { DashboardPanels } from './components/DashboardPanels/DashboardPanels.jsx';
import { StrategyPanel } from './components/StrategyPanel/StrategyPanel.jsx';
import { BattlePanel } from './components/BattlePanel/BattlePanel.jsx';
import { AnalyticsPanel } from './components/AnalyticsPanel/AnalyticsPanel.jsx';
import { TeamRadioPanel } from './components/TeamRadioPanel/TeamRadioPanel.jsx';

export function App() {
  const state = useFormulaDeltaStore();
  const [client, setClient] = useState(null);
  const [delayMs, setDelayMs] = useState(0);
  useEffect(() => {
    const client = createWebSocketClient({
      url: import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:3000',
      onState: (next) => useFormulaDeltaStore.setState(next),
      onConnection: (status) => useFormulaDeltaStore.getState().setConnectionStatus(status),
    });
    setClient(client);
    return () => client.stop();
  }, []);
  return (
    <main className={styles.appShell}>
      <DashboardHeader
        session={{ ...state.session, trackStatus: state.track?.status, source: state.source?.mode }}
        connectionStatus={state.connectionStatus}
      />
      <section className={styles.layout}>
        <TimingTower timing={state.timing} drivers={state.drivers} />
        <DashboardPanels state={state} client={client} delayMs={delayMs} setDelayMs={setDelayMs} />
      </section>
      <StrategyPanel stints={state.stints} drivers={state.drivers} timing={state.timing} />
      <BattlePanel timing={state.timing} drivers={state.drivers} gapHistory={state.gapHistory} />
      <AnalyticsPanel timing={state.timing} drivers={state.drivers} lapHistory={state.lapHistory} />
      <TeamRadioPanel messages={state.teamRadio} drivers={state.drivers} />
    </main>
  );
}
