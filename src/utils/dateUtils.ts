/**
 * Date and Month utilities for the Student Fees Tracker
 */

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMonthLabel(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function getAdjacentMonthKey(monthKey: string, offset: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month + offset, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

export function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Returns recent months in descending order (e.g. from current month going back N months)
 */
export function getRecentMonths(centerMonthKey: string, pastCount = 11, futureCount = 1): string[] {
  const months: string[] = [];
  for (let i = futureCount; i >= -pastCount; i--) {
    months.push(getAdjacentMonthKey(centerMonthKey, i));
  }
  return months;
}
