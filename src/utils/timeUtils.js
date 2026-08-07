/**
 * Centralized Date & Time Utilities for School Management System
 * Enforces local timezone consistency across Live Classes, Timetable, and Online MCQ modules.
 */

/**
 * Format a ISO/Date string to local human readable label
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return String(dateInput);
  }
}

/**
 * Format Date object to HTML datetime-local input string format (YYYY-MM-DDTHH:mm)
 */
export function toDateTimeLocalString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get future datetime-local string (default +1 hour from now)
 */
export function getFutureDateTimeLocalString(hoursToAdd = 1) {
  const d = new Date();
  d.setHours(d.getHours() + hoursToAdd);
  return toDateTimeLocalString(d);
}

/**
 * Centralized Status Evaluation for Live Classes & Online MCQ
 * Evaluates whether an item is 'upcoming', 'active' (live), or 'expired' (completed).
 */
export function computeScheduleStatus(startsAt, endsAt, currentStatus = null) {
  if (!startsAt) return currentStatus || "scheduled";
  
  try {
    const now = new Date();
    const startTime = new Date(startsAt);
    const endTime = endsAt ? new Date(endsAt) : null;

    if (isNaN(startTime.getTime())) return currentStatus || "scheduled";

    // If current time is after end time, it is expired/completed
    if (endTime && !isNaN(endTime.getTime()) && now >= endTime) {
      return "expired";
    }

    // If current time is between start and end time (or start time reached and no end time)
    if (now >= startTime && (!endTime || now < endTime)) {
      return "active";
    }

    // If start time is in the future
    if (now < startTime) {
      return "upcoming";
    }

    return currentStatus || "scheduled";
  } catch (e) {
    return currentStatus || "scheduled";
  }
}
