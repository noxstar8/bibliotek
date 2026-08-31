import type { Metadata } from "next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Bookmark02Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

import { AdminNav } from "@/components/admin-nav";
import { LibrarianRequired } from "@/components/librarian-required";
import { PageHeading } from "@/components/page-heading";
import {
  ColumnHead,
  IDENTITY_CELL,
  RecordCell,
  SECONDARY_CELL,
} from "@/components/record-cell";
import { ReservationActions } from "@/components/reservation-actions";
import { ReservationStatusCell } from "@/components/reservation-status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isLibrarian, requireBorrower } from "@/lib/auth";
import { describeError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { listOpenReservations } from "@/lib/loans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reservasjoner – Bibliotek",
  description: "Hele reservasjonskøen, med utlevering og sletting",
};

export default async function ReservationsPage({
  searchParams,
}: PageProps<"/admin/reservasjoner">) {
  const user = await requireBorrower();
  if (!isLibrarian(user)) {
    return (
      <>
        <PageHeading title="Reservasjoner" />
        <LibrarianRequired user={user} />
      </>
    );
  }

  const [reservations, { feil, utlevert, slettet }] = await Promise.all([
    listOpenReservations(),
    searchParams,
  ]);

  const error = describeError(feil);
  const ready = reservations.filter(
    (reservation) => reservation.status === "ready"
  ).length;

  return (
    <>
      <PageHeading title="Reservasjoner">
        Hele køen, på tvers av titlene. Eksemplarer som er satt av til henting
        står øverst — de venter på at noen kommer i skranken.
      </PageHeading>
      <AdminNav />

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.description}</AlertDescription>
        </Alert>
      ) : null}

      {typeof utlevert === "string" ? (
        <Alert className="mb-6">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
          <AlertTitle>Boken er levert ut til {utlevert}</AlertTitle>
          <AlertDescription>
            Reservasjonen er ute av køen, og lånet løper i 28 dager. Det står nå
            under aktive lån.
          </AlertDescription>
        </Alert>
      ) : null}

      {typeof slettet === "string" ? (
        <Alert className="mb-6">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
          <AlertTitle>Reservasjonen på «{slettet}» er slettet</AlertTitle>
          <AlertDescription>
            Personen står ikke lenger i køen. Var et eksemplar satt av, er det nå
            gitt videre til neste som venter.
          </AlertDescription>
        </Alert>
      ) : null}

      {reservations.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Bookmark02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Ingen reservasjoner</EmptyTitle>
            <EmptyDescription>
              Ingen står i kø akkurat nå. En reservasjon dukker opp her så snart
              en låner stiller seg i kø for en tittel som er helt utlånt.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Køen</CardTitle>
            <CardDescription>
              Klar til henting øverst, ellers eldste reservasjon først.
            </CardDescription>
            <CardAction>
              {ready > 0 ? (
                <Badge>{ready} klar til henting</Badge>
              ) : (
                <Badge variant="secondary">{reservations.length} i kø</Badge>
              )}
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <ColumnHead className="pl-(--card-spacing)">Bok</ColumnHead>
                  <ColumnHead>Låner</ColumnHead>
                  <ColumnHead>Reservert</ColumnHead>
                  <ColumnHead>Status</ColumnHead>
                  <ColumnHead className="pr-(--card-spacing) text-right">
                    Handling
                  </ColumnHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell
                      className={`py-3 pl-(--card-spacing) ${IDENTITY_CELL}`}
                    >
                      <RecordCell
                        icon={Bookmark02Icon}
                        name={reservation.book?.title ?? "Ukjent tittel"}
                        href={
                          reservation.book ? `/boker/${reservation.book.id}` : undefined
                        }
                      >
                        {reservation.book?.author}
                      </RecordCell>
                    </TableCell>
                    <TableCell className={`py-3 ${SECONDARY_CELL}`}>
                      <RecordCell name={reservation.borrower?.name ?? "Ukjent låner"}>
                        {reservation.borrower?.email}
                      </RecordCell>
                    </TableCell>
                    <TableCell className="py-3 tabular-nums">
                      {formatDate(reservation.reservedAt)}
                    </TableCell>
                    <TableCell className="py-3">
                      <ReservationStatusCell reservation={reservation} />
                    </TableCell>
                    <TableCell className="py-3 pr-(--card-spacing) text-right">
                      <ReservationActions
                        reservation={reservation}
                        canCollect={reservation.collectable}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
