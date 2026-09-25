import { memo, useMemo, useState } from 'react';
import {
  filterTeamRadioMessages,
  getAllRadioDriverIds,
  toggleRadioDriver,
} from '../../state/team-radio.js';
import styles from './TeamRadioPanel.module.css';

export const TeamRadioPanel = memo(function TeamRadioPanel({ messages = [], drivers = {} }) {
  const [selectedDrivers, setSelectedDrivers] = useState(null);
  const driverIds = Object.keys(drivers);
  const allSelected = selectedDrivers !== null && driverIds.length > 0 && driverIds.every((id) =>
    selectedDrivers.some((selectedId) => String(selectedId) === id),
  );
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
        <button
          className={allSelected ? styles.selected : undefined}
          type="button"
          aria-pressed={allSelected}
          onClick={() => setSelectedDrivers(allSelected ? [] : getAllRadioDriverIds(drivers))}
        >
          {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
        {driverIds.map((id) => {
          const selected = selectedDrivers?.some((selectedId) => String(selectedId) === id) ?? false;
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
                  <>
                    <audio controls preload="none" src={message.url} onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false; }} />
                    <span hidden>Audio failed to load</span>
                  </>
                ) : (
                  <span>Audio unavailable</span>
                )}
              </article>
            ))}
        </div>
      ) : (
        <p className={styles.empty}>
          {messages.length ? 'No hay audios para los pilotos seleccionados' : 'Audio de radio no disponible'}
        </p>
      )}
    </section>
  );
});
