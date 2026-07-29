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
