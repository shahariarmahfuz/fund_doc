import { format as formatTz, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, addDays } from 'date-fns';

export function getTimezone(): string {
  if (typeof window !== 'undefined') {
    return (window as any).APP_TIMEZONE || 'Asia/Dhaka';
  } else {
    return (globalThis as any).APP_TIMEZONE || 'Asia/Dhaka';
  }
}

export function getDateFormat(): string {
  if (typeof window !== 'undefined') {
    return (window as any).APP_DATE_FORMAT || 'dd MMM yyyy';
  } else {
    return (globalThis as any).APP_DATE_FORMAT || 'dd MMM yyyy';
  }
}

/**
 * Returns the current date in the application timezone.
 */
export function getNow(): Date {
  return toZonedTime(new Date(), getTimezone());
}

/**
 * Converts any UTC or local date to application time.
 */
export function toDhakaTime(date: Date | string | number): Date {
  return toZonedTime(date, getTimezone());
}

/**
 * Converts a Dhaka time back to UTC.
 */
export function fromDhakaTime(date: Date | string | number): Date {
  return fromZonedTime(date, getTimezone());
}

// ------------------------------------------------------------------
// FORMATTING (English Only)
// ------------------------------------------------------------------

/**
 * Formats date as DD MMM YYYY (e.g., "26 Jul 2026")
 */
export function formatDate(date: Date | string | number): string {
  const dhakaDate = toDhakaTime(date);
  let fmt = getDateFormat();
  if (fmt === 'DD/MM/YYYY') fmt = 'dd/MM/yyyy';
  if (fmt === 'MM/DD/YYYY') fmt = 'MM/dd/yyyy';
  if (fmt === 'YYYY-MM-DD') fmt = 'yyyy-MM-dd';
  if (fmt === 'DD MMM YYYY') fmt = 'dd MMM yyyy';
  if (fmt === 'DD MMMM YYYY') fmt = 'dd MMMM yyyy';

  return formatTz(dhakaDate, fmt, { timeZone: getTimezone() });
}

/**
 * Formats time as standard 12-hour format with AM/PM (e.g., "9:30 AM")
 */
export function formatTimeBangla(date: Date | string | number): string {
  const dhakaDate = toDhakaTime(date);
  return formatTz(dhakaDate, 'h:mm a', { timeZone: getTimezone() });
}

export function formatTime(date: Date | string | number): string {
  return formatTimeBangla(date);
}

/**
 * Formats date to relative string (Today, Yesterday, Tomorrow) or falls back to DD MMM YYYY
 */
export function formatRelativeDateBangla(date: Date | string | number): string {
  const targetDate = toDhakaTime(date);
  const now = getNow();

  if (isSameDay(targetDate, now)) return 'Today';
  if (isSameDay(targetDate, addDays(now, -1))) return 'Yesterday';
  if (isSameDay(targetDate, addDays(now, 1))) return 'Tomorrow';

  return formatDate(targetDate);
}

export function formatRelativeDate(date: Date | string | number): string {
  return formatRelativeDateBangla(date);
}

// ------------------------------------------------------------------
// DATE RANGES
// ------------------------------------------------------------------

export function getTodayBounds() {
  const now = getNow();
  return {
    start: fromDhakaTime(startOfDay(now)),
    end: fromDhakaTime(endOfDay(now))
  };
}

export function getThisWeekBounds() {
  const now = getNow();
  return {
    start: fromDhakaTime(startOfWeek(now, { weekStartsOn: 0 })),
    end: fromDhakaTime(endOfWeek(now, { weekStartsOn: 0 }))
  };
}

export function getThisMonthBounds() {
  const now = getNow();
  return {
    start: fromDhakaTime(startOfMonth(now)),
    end: fromDhakaTime(endOfMonth(now))
  };
}

export function getNext7DaysBounds() {
  const now = getNow();
  return {
    start: fromDhakaTime(startOfDay(now)),
    end: fromDhakaTime(endOfDay(addDays(now, 7)))
  };
}

export function formatDateTimeBanglaLocal(date: Date | string | number): string {
  const dhakaDate = toDhakaTime(date);
  return formatTz(dhakaDate, 'dd/MM/yyyy, h:mm:ss a', { timeZone: getTimezone() });
}

export function formatDateBanglaLocal(date: Date | string | number): string {
  return formatDate(date);
}

export function formatDateInput(date: Date | string | number): string {
  const dhakaDate = toDhakaTime(date);
  return formatTz(dhakaDate, 'yyyy-MM-dd', { timeZone: getTimezone() });
}
