import { useMemo, useState } from 'react';
import { filterTeamRadioMessages, toggleRadioDriver } from '../../state/team-radio.js';
import styles from './TeamRadioPanel.module.css';

export function TeamRadioPanel({ messages = [], drivers = {} }) {
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const driverIds = Object.keys(drivers);
  const visibleMessages = useMemo(
    () => filterTeamRadioMessages(messages, selectedDrivers),
    [messages, selectedDrivers],
  );

  return (
    <section className={styles.panel} aria-label="Team radio">
      <div className={styles.heading}>
        <div>
          <p>TEAM RADIO</p>
          <h2>Driver channels</h2>
        </div>
        <span>{visibleMessages.length} messages</span>
      </div>
      <div className={styles.filters}>
        {driverIds.map((id) => {
          const selected = selectedDrivers.includes(id) || selectedDrivers.includes(Number(id));
          return (
            <button
              className={selected ? styles.selected : undefined}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedDrivers(toggleRadioDriver(selectedDrivers, id))}
              key={id}
            >
              {drivers[id]?.abbreviation || id}
            </button>
          );
        })}
      </div>
      {visibleMessages.length ? (
        <div className={styles.messages}>
          {visibleMessages
            .slice(-5)
            .reverse()
            .map((message) => (
              <article key={message.id || `${message.driverId}-${message.timestamp}`}>
                <strong>{drivers[message.driverId]?.abbreviation || message.driverId}</strong>
                {message.url ? (
                  <audio controls preload="none" src={message.url} />
                ) : (
                  <span>Audio unavailable</span>
                )}
              </article>
            ))}
        </div>
      ) : (
        <p className={styles.empty}>Team Radio unavailable or no driver selected</p>
      )}
    </section>
  );
}
