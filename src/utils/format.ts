const MINUTE_MS = 60_000;

/** Human readable game duration, e.g. "< 1 min", "38 min", "1 h 05 min". */
export function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.floor(Math.max(0, milliseconds) / MINUTE_MS);
  if (totalMinutes < 1) return '< 1 min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${String(minutes).padStart(2, '0')} min`;
}

const dateTimeFormat = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Localized date and time, e.g. "sab 1 nov 2026, 21:40". */
export function formatDateTime(timestamp: number): string {
  return dateTimeFormat.format(new Date(timestamp));
}

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const roundsLabel = (rounds: number) => (rounds === 1 ? '1 giro' : `${rounds} giri`);
