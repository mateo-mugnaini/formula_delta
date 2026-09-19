export function calculateAverageLapTime(laps = [], sampleSize = 3) {
  const values = laps
    .slice(-sampleSize)
    .map((lap) => lap?.milliseconds ?? lap)
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!values.length) return null;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export function calculateGapTrend(history = []) {
  if (history.length < 2) return { direction: 'stable', deltaMilliseconds: 0 };
  const deltaMilliseconds = history.at(-1) - history[0];
  if (Math.abs(deltaMilliseconds) < 50) {
    return { direction: 'stable', deltaMilliseconds };
  }
  return {
    direction: deltaMilliseconds > 0 ? 'widening' : 'closing',
    deltaMilliseconds,
  };
}

export function calculatePaceDelta(laps = [], sampleSize = 3) {
  if (laps.length < sampleSize * 2) return null;
  const previous = calculateAverageLapTime(laps.slice(0, -sampleSize), sampleSize);
  const recent = calculateAverageLapTime(laps, sampleSize);
  if (previous == null || recent == null) return null;
  return recent - previous;
}

export function estimateDegradation(laps = []) {
  if (laps.length < 3) return null;
  const values = laps.map((lap) => lap?.milliseconds ?? lap).filter(Number.isFinite);
  if (values.length < 3) return null;
  return Math.round((values.at(-1) - values[0]) / (values.length - 1));
}
