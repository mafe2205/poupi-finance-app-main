/** Formats an ISO date (yyyy-mm-dd) as dd/mm/yyyy. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

// "yyyy-mm-01" alone is parsed as UTC midnight, which in Brazil (UTC-3) is still the previous
// month's last day — noon local time keeps the month right in any timezone.
function monthDate(month: string) {
  return new Date(`${month.slice(0, 7)}-01T12:00:00`);
}

/** Formats a yyyy-mm month string as "ago/2026". */
export function formatMonthLabel(month: string): string {
  return monthDate(month).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
}

/** Formats a yyyy-mm (or yyyy-mm-dd) string as "ago" — for chart axes. */
export function formatShortMonth(month: string): string {
  return monthDate(month).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

/** Converts a dd/mm/yyyy string to an ISO yyyy-mm-dd string. */
export function toIsoDate(brDate: string): string {
  const [day, month, year] = brDate.split('/');
  if (!day || !month || !year) return brDate;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
