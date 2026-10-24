/**
 * Date and schedule calculation utilities for HCM Lite
 */

export const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export function isWeekend(date: Date, weekendConfig: string = "SATURDAY,SUNDAY"): boolean {
  const dayIndex = date.getDay();
  const dayName = DAY_NAMES[dayIndex];
  const configured = weekendConfig.toUpperCase().split(",").map((s) => s.trim());
  return configured.includes(dayName);
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isPublicHoliday(date: Date, holidays: { date: Date }[]): boolean {
  return holidays.some((h) => isSameDay(new Date(h.date), date));
}

export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  weekendConfig: string = "SATURDAY,SUNDAY",
  holidays: { date: Date }[] = []
): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    if (!isWeekend(current, weekendConfig) && !isPublicHoliday(current, holidays)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

export function getWorkingDaysInMonth(
  year: number,
  month: number, // 1-12
  weekendConfig: string = "SATURDAY,SUNDAY",
  holidays: { date: Date }[] = []
): number {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0)); // last day of month
  return calculateWorkingDays(startDate, endDate, weekendConfig, holidays);
}

/**
 * Calculates distance between two points in meters using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
