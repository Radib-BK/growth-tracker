export const BIRTH_YEAR_START = 1940;

export function getMaxBirthYear(): number {
  return new Date().getFullYear() - 10;
}

export function yearOptions(): number[] {
  const max = getMaxBirthYear();
  return Array.from({ length: max - BIRTH_YEAR_START + 1 }, (_, i) => max - i);
}

export function monthOptions(): { value: string; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const value = String(i + 1).padStart(2, "0");
    return { value, label: value };
  });
}

/** month is 1–12 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function dayOptions(year: number, month: number): string[] {
  const count = daysInMonth(year, month);
  return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, "0"));
}

export function toBirthdateString(year: string, month: string, day: string): string {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** Returns true if YYYY-MM-DD is a real calendar date */
export function isValidBirthdate(year: string, month: string, day: string): boolean {
  if (!year || !month || !day) return false;
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
  if (d < 1 || d > daysInMonth(y, m)) return false;
  return (
    toBirthdateString(year, month, day) ===
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  );
}
