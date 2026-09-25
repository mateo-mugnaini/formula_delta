import styles from './TrackFlag.module.css';

export function TrackFlag({ status, code }) {
  const variant = getFlagVariant(status, code);
  const labels = { green: 'GREEN', yellow: 'YELLOW', red: 'RED', chequered: 'CHEQUERED', unknown: 'UNKNOWN' };
  return (
    <span className={`${styles.flag} ${styles[variant]}`} title={`Track status: ${labels[variant]}`}>
      <svg viewBox="0 0 32 20" aria-hidden="true" focusable="false">
        {variant === 'chequered' ? <CheckerPattern /> : <rect width="32" height="20" rx="2" />}
      </svg>
      <span>{labels[variant]}</span>
    </span>
  );
}

function CheckerPattern() {
  return Array.from({ length: 16 }, (_, index) => (
    <rect key={index} x={(index % 4) * 8} y={Math.floor(index / 4) * 5} width="8" height="5" />
  ));
}

function getFlagVariant(status = '', code = '') {
  const value = `${status} ${code}`.toLowerCase();
  if (value.includes('red') || value.includes('roja') || value === '5') return 'red';
  if (value.includes('yellow') || value.includes('amar') || value.includes('safety') || value.includes('vsc') || value === '2') return 'yellow';
  if (value.includes('chequer') || value.includes('check') || value.includes('finish') || value.includes('cuad') || value === '6') return 'chequered';
  if (value.includes('green') || value.includes('verde') || value.includes('clear') || value === '1') return 'green';
  return 'unknown';
}
