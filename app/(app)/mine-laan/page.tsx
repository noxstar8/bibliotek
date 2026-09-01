import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowRight01Icon,
  Book02Icon,
  Bookmark02Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";

import { LoanStatusCell } from "@/components/loan-status";
import { PageHeading } from "@/components/page-heading";
import { ColumnHead, IDENTITY_CELL, RecordCell } from "@/components/record-cell";
import { ReservationStatusCell } from "@/components/reservation-status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
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
import { cancelReservationAction } from "@/lib/actions";
import { requireBorrower } from "@/lib/auth";
import { describeError } from "@/lib/errors";
import { formatDate, formatKroner } from "@/lib/format";
import {
  listLoansForBorrower,
  listReservationsForBorrower,
  outstandingFees,
} from "@/lib/loans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mine lån – Bibliotek",
  description: "Bøkene du har lånt og står i kø for, med frister og eventuelle gebyrer",
};

export default async function MyLoansPage({ searchParams }: PageProps<"/mine-laan">) {
  const borrower = await requireBorrower();
  const [loans, reservations, { feil, reservert, avbestilt }] = await Promise.all([
    listLoansForBorrower(borrower.id),
    listReservationsForBorrower(borrower.id),
    searchParams,
  ]);

  const error = describeError(feil);
  const outstanding = outstandingFees(loans);

  // Only the live queue belongs on this page. A reservation that has been
  // collected is a loan now, and one that was withdrawn is not owed to anybody
  // — neither is something the reader can act on.
  const queued = reservations.filter(
    (reservation) => reservation.status === "waiting" || reservation.status === "ready"
  );
  const ready = queued.filter((reservation) => reservation.status === "ready").length;

  return (
    <>
      <PageHeading title="Mine lån">
        Lån registrert på {borrower.name}. Gebyret er 10 kr for hver dag en bok
        er forsinket, og stopper på 200 kr.
      </PageHeading>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.description}</AlertDescription>
        </Alert>
      ) : null}

      {typeof reservert === "string" ? (
        <Alert className="mb-6">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
          <AlertTitle>Du står i kø for «{reservert}»</AlertTitle>
          <AlertDescription>
            Vi setter av et eksemplar til deg så snart et blir levert inn.
            Reservasjonen står i listen under.
          </AlertDescription>
        </Alert>
      ) : null}

      {typeof avbestilt === "string" ? (
        <Alert className="mb-6">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
          <AlertTitle>Reservasjonen på «{avbestilt}» er avbestilt</AlertTitle>
          <AlertDescription>
            Du står ikke lenger i køen. Var et eksemplar satt av til deg, går det
            videre til neste som venter.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* No empty state for this card: a reservation is made from a book page,
          so an empty box here would have nothing to offer. When the queue is
          empty the card simply is not there. */}
      {queued.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mine reservasjoner</CardTitle>
            <CardDescription>
              Titler du står i kø for. Sier du fra deg en reservasjon, mister du
              plassen i køen.
            </CardDescription>
            <CardAction>
              {ready > 0 ? (
                <Badge>{ready} klar til henting</Badge>
              ) : (
                <Badge variant="secondary">{queued.length} i kø</Badge>
              )}
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <ColumnHead className="pl-(--card-spacing)">Tittel</ColumnHead>
                  <ColumnHead>Reservert</ColumnHead>
                  <ColumnHead>Status</ColumnHead>
                  <ColumnHead className="pr-(--card-spacing) text-right">
                    Handling
                  </ColumnHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queued.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell
                      className={`py-3 pl-(--card-spacing) ${IDENTITY_CELL}`}
                    >
                      <RecordCell
                        icon={Bookmark02Icon}
                        name={reservation.book?.title ?? "Ukjent tittel"}
                        href={
                          reservation.book
                            ? `/boker/${reservation.book.id}`
                            : undefined
                        }
                      >
                        {reservation.book?.author}
                      </RecordCell>
                    </TableCell>
                    <TableCell className="py-3 tabular-nums">
                      {formatDate(reservation.reservedAt)}
                    </TableCell>
                    <TableCell className="py-3">
                      <ReservationStatusCell reservation={reservation} />
                    </TableCell>
                    <TableCell className="py-3 pr-(--card-spacing) text-right">
                      {/* The form lives outside the popup. A menu closes the
                          instant an item is pressed, and a form torn out of the
                          tree mid-submit never completes — so the item points at
                          this one with the native `form` attribute. */}
                      <form
                        id={`avbestill-${reservation.id}`}
                        action={cancelReservationAction}
                        className="hidden"
                      >
                        <input
                          type="hidden"
                          name="reservationId"
                          value={reservation.id}
                        />
                        <input
                          type="hidden"
                          name="title"
                          value={reservation.book?.title ?? ""}
                        />
                      </form>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={buttonVariants({
                            variant: "ghost",
                            size: "icon-sm",
                          })}
                          aria-label={`Handlinger for «${reservation.book?.title ?? "ukjent tittel"}»`}
                        >
                          <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {reservation.book ? (
                            <DropdownMenuItem
                              render={
                                <Link href={`/boker/${reservation.book.id}`} />
                              }
                            >
                              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                              Se bok
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            nativeButton
                            variant="destructive"
                            render={
                              <button
                                type="submit"
                                form={`avbestill-${reservation.id}`}
                              />
                            }
                          >
                            <HugeiconsIcon icon={Bookmark02Icon} strokeWidth={2} />
                            Si fra deg reservasjonen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {loans.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Ingen lån ennå</EmptyTitle>
            <EmptyDescription>
              Du har ingen bøker ute og ingen lånehistorikk. Finn en tittel i
              samlingen for å låne den.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
              Se boklisten
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lånehistorikk</CardTitle>
            <CardDescription>
              {outstanding > 0
                ? `Du skylder ${formatKroner(outstanding)} i gebyr på lån som ikke er levert.`
                : "Ingen ubetalte gebyrer på lånene dine."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <ColumnHead className="pl-(--card-spacing)">Tittel</ColumnHead>
                  <ColumnHead>Frist</ColumnHead>
                  <ColumnHead className="pr-(--card-spacing)">Status</ColumnHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell
                      className={`py-3 pl-(--card-spacing) ${IDENTITY_CELL}`}
                    >
                      <RecordCell
                        icon={Book02Icon}
                        name={loan.book?.title ?? "Ukjent tittel"}
                        href={loan.book ? `/boker/${loan.book.id}` : undefined}
                      >
                        {loan.book?.author}
                      </RecordCell>
                    </TableCell>
                    <TableCell className="py-3 tabular-nums">
                      {formatDate(loan.dueAt)}
                    </TableCell>
                    <TableCell className="py-3 pr-(--card-spacing)">
                      <LoanStatusCell loan={loan} />
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
