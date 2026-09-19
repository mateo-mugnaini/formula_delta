import { useEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import { createWebSocketClient } from "./websocket/client.js";
import { useFormulaDeltaStore } from "./state/store.js";

export function App() {
  const state = useFormulaDeltaStore();
  const clientRef = useRef(null);
  const [delayMs, setDelayMs] = useState(0);
  useEffect(() => {
    const client = createWebSocketClient({
      url: import.meta.env.VITE_WS_URL || "ws://127.0.0.1:3000",
      onState: (next) => useFormulaDeltaStore.setState(next),
      onConnection: (status) =>
        useFormulaDeltaStore.getState().setConnectionStatus(status),
    });
    clientRef.current = client;
    return () => client.stop();
  }, []);
  const timingRows = Object.entries(state.timing || {}).sort(
    ([, a], [, b]) => (a.position ?? 999) - (b.position ?? 999),
  );
  return (
    <main className={styles.appShell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>FORMULA DELTA</p>
          <h1>{state.session?.name || "Live timing"}</h1>
        </div>
        <div className={styles.headerMeta}>
          <span>
            {state.session?.currentLap
              ? `LAP ${state.session.currentLap}`
              : "SESSION READY"}
          </span>
          <ConnectionStatus status={state.connectionStatus} />
        </div>
      </header>
      <div className={styles.statusBar}>
        <strong className={styles.trackStatus}>
          {state.track?.status || "TRACK STATUS UNKNOWN"}
        </strong>
        <span>{state.session?.type || "Formula 1 session"}</span>
        <span>{state.source?.mode || "unknown"} source</span>
      </div>
      <section className={styles.layout}>
        <section className={styles.tower} aria-label="Timing tower">
          <div className={styles.sectionHeading}>
            <h2>Timing</h2>
            <span>{timingRows.length} drivers</span>
          </div>
          <div className={styles.columnHeader}>
            <span>POS</span>
            <span>DRIVER</span>
            <span>GAP</span>
            <span>LAST LAP</span>
            <span>TYRE</span>
          </div>
          {timingRows.length ? (
            <div>
              {timingRows.map(([id, row]) => (
                <div className={styles.row} key={id}>
                  <strong>{row.position ?? "—"}</strong>
                  <span className={styles.driverCell}>
                    <span className={styles.driver}>
                      {state.drivers?.[id]?.abbreviation || id}
                    </span>
                    <small>
                      {row.status ||
                        `INT ${row.intervalToAhead?.display || "—"} · AGE ${row.tyreAge ?? "—"} · PIT ${row.pitStops ?? 0}`}
                    </small>
                    <small className={styles.sectors}>
                      S1 {row.sectors?.[0]?.display || "—"} · S2{" "}
                      {row.sectors?.[1]?.display || "—"} · S3{" "}
                      {row.sectors?.[2]?.display || "—"}
                    </small>
                  </span>
                  <span>{row.gapToLeader?.display || "—"}</span>
                  <span>{row.lastLapTime?.display || "—"}</span>
                  <span className={styles.tyre}>
                    {row.tyre?.compound || "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Waiting for timing data" />
          )}
        </section>
        <aside className={styles.rail}>
          <Panel title="Race control">
            {state.raceControl?.length ? (
              <div className={styles.messages}>
                {state.raceControl
                  .slice(-4)
                  .reverse()
                  .map((event) => (
                    <p key={event.id}>
                      <strong>{event.category || "EVENT"}</strong>
                      <span>{event.message}</span>
                    </p>
                  ))}
              </div>
            ) : (
              <Empty text="No recent messages" />
            )}
          </Panel>
          <Panel title="Pit activity">
            {Object.entries(state.timing || {})
              .filter(([, row]) => row.inPit || row.pitLane || row.pitStops)
              .slice(0, 4)
              .map(([id, row]) => (
                <p className={styles.pitRow} key={id}>
                  <strong>{state.drivers?.[id]?.abbreviation || id}</strong>
                  <span>
                    {row.inPit
                      ? "IN PIT"
                      : row.pitLane
                        ? "PIT LANE"
                        : `${row.pitStops} STOPS`}
                  </span>
                </p>
              ))}
            {!Object.values(state.timing || {}).some(
              (row) => row.inPit || row.pitLane,
            ) && <Empty text="No active pit events" />}
          </Panel>
          <Panel title="Weather">
            <div className={styles.weather}>
              <Metric
                label="Air"
                value={state.weather?.airTemperatureC}
                suffix="°C"
              />
              <Metric
                label="Track"
                value={state.weather?.trackTemperatureC}
                suffix="°C"
              />
              <Metric
                label="Rain"
                value={state.weather?.rainfall ? "YES" : "NO"}
              />
            </div>
          </Panel>
          {state.source?.mode === "replay" && (
            <Panel title="Replay">
              <div className={styles.replay}>
                <span>
                  {state.replay?.status || "idle"} · {state.replay?.speed || 1}x
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      clientRef.current?.send({
                        type: "COMMAND",
                        command: "REPLAY_PLAY",
                      })
                    }
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      clientRef.current?.send({
                        type: "COMMAND",
                        command: "REPLAY_PAUSE",
                      })
                    }
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      clientRef.current?.send({
                        type: "COMMAND",
                        command: "REPLAY_RESTART",
                      })
                    }
                  >
                    Restart
                  </button>
                </div>
              </div>
            </Panel>
          )}
          <Panel title="Capabilities">
            <div className={styles.capabilities}>
              {[
                "timing",
                "tyres",
                "weather",
                "raceControl",
                "teamRadio",
                "carTelemetry",
                "livePosition",
              ].map((name) => (
                <span
                  className={
                    state.capabilities?.[name]
                      ? styles.available
                      : styles.unavailable
                  }
                  key={name}
                >
                  <i />
                  {name}
                </span>
              ))}
            </div>
          </Panel>
          <Panel title="Broadcast delay">
            <div className={styles.delayControl}>
              <label htmlFor="delay">Delay (seconds)</label>
              <div>
                <input
                  id="delay"
                  type="number"
                  min="0"
                  max="86400"
                  step="1"
                  value={delayMs / 1000}
                  onChange={(event) =>
                    setDelayMs(Number(event.target.value) * 1000)
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    clientRef.current?.send({
                      type: "COMMAND",
                      command: "SYNC_SET_DELAY",
                      payload: { delayMs },
                    })
                  }
                >
                  Apply
                </button>
              </div>
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function ConnectionStatus({ status }) {
  return (
    <span
      className={`${styles.connection} ${status === "connected" ? styles.connected : ""}`}
    >
      <i />
      {status}
    </span>
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
function Metric({ label, value, suffix = "" }) {
  return (
    <div>
      <span>{label}</span>
      <strong>
        {value ?? "—"}
        {value != null && suffix}
      </strong>
    </div>
  );
}
