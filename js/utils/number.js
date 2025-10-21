export function formatNumber(value) {
  return (Math.round(value * 10) / 10).toLocaleString("nl-NL");
}

export function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function round1(value) {
  return Math.round(value * 10) / 10;
}
