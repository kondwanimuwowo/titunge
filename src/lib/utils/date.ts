export function getZambianDate(): string {
  const date = new Date();
  // Get date strictly in Africa/Lusaka timezone
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lusaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("/")
    .reverse()
    .join("-")
    .replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1-$3-$2"); // US is MM/DD/YYYY, we want YYYY-MM-DD
}

export function getZambianDateTime(): Date {
  const date = new Date();
  const luxDateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lusaka",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).format(date);
  return new Date(luxDateStr);
}

/** Hours on an attendance record: the stored total once clocked out, or the
 *  time so far for a shift that's still open. Clock times are stored as
 *  Lusaka wall-clock strings, so "now" is read the same way. */
export function attendanceHours(record: {
  clock_in?: string | null;
  clock_out?: string | null;
  hours_worked?: number | string | null;
}): number {
  if (record.hours_worked !== null && record.hours_worked !== undefined && record.clock_out) {
    return parseFloat(String(record.hours_worked)) || 0;
  }
  if (!record.clock_in || record.clock_out) return 0;
  const nowWallClock = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lusaka" }));
  const clockIn = new Date(record.clock_in.replace(/Z$/, ""));
  const hours = (nowWallClock.getTime() - clockIn.getTime()) / 3_600_000;
  return Number.isFinite(hours) ? Math.max(0, Math.round(hours * 100) / 100) : 0;
}
