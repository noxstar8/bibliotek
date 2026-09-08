import { toDate, type DateInput } from "@/lib/dates";

/**
 * Norwegian formatting for the interface. Dates are rendered in UTC — the same
 * zone they are stored in — so the day shown is the day the rules counted, and
 * server and client never disagree.
 */

const dateFormat = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const numberFormat = new Intl.NumberFormat("nb-NO");

export function formatDate(value: DateInput): string {
  return dateFormat.format(toDate(value));
}

export function formatKroner(amount: number): string {
  return `${numberFormat.format(amount)} kr`;
}

/** "1 dag" / "5 dager" — the unit follows the count. */
export function formatDays(count: number): string {
  return `${numberFormat.format(count)} ${count === 1 ? "dag" : "dager"}`;
}
