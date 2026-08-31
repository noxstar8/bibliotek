import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { ReservationView } from "@/lib/loans";

const labels = {
  ready: { text: "Klar til henting", variant: "default" },
  waiting: { text: "I kø", variant: "secondary" },
  fulfilled: { text: "Hentet", variant: "secondary" },
  cancelled: { text: "Avbestilt", variant: "outline" },
} as const;

/**
 * The state of a reservation: a badge with the wording beside it, never colour
 * alone.
 *
 * «Klar til henting» is the `default` badge because it is the one state anybody
 * can act on — a book is lying in the counter waiting for its person. Waiting
 * in line is neutral, and a reservation that has left the queue is quieter
 * still.
 */
export function ReservationStatusCell({
  reservation,
}: {
  reservation: ReservationView;
}) {
  const { text, variant } = labels[reservation.status];

  return (
    <div className="flex flex-col items-start gap-1.5 leading-snug">
      <Badge variant={variant}>{text}</Badge>
      <span className="text-muted-foreground">
        {reservation.status === "waiting" ? `Nr. ${reservation.position} i køen` : null}
        {reservation.status === "ready" && reservation.readyAt
          ? `Satt av ${formatDate(reservation.readyAt)}`
          : null}
        {reservation.status !== "waiting" &&
        reservation.status !== "ready" &&
        reservation.closedAt
          ? formatDate(reservation.closedAt)
          : null}
      </span>
    </div>
  );
}
