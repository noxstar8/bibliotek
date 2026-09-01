import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Book02Icon,
  Bookmark02Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

import { BorrowerRole } from "@/components/borrower-role";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Fact } from "@/components/fact";
import { LibrarianRequired } from "@/components/librarian-required";
import { LoanStatusCell } from "@/components/loan-status";
import { PageHeading } from "@/components/page-heading";
import { ColumnHead, IDENTITY_CELL, RecordCell } from "@/components/record-cell";
import { ReservationStatusCell } from "@/components/reservation-status";
import { RoleBadge } from "@/components/role-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isLibrarian, requireBorrower } from "@/lib/auth";
import { isOpen } from "@/lib/availability";
import { roleRefusal } from "@/lib/borrowers";
import { getBorrower, getBorrowers } from "@/lib/db";
import { describeError } from "@/lib/errors";
import { formatDate, formatKroner } from "@/lib/format";
import {
  listLoansForBorrower,
  listReservationsForBorrower,
  type LoanView,
  outstandingFees,
} from "@/lib/loans";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/admin/brukere/[id]">): Promise<Metadata> {
  const person = await getBorrower((await params).id);
  if (!person) return { title: "Ukjent bruker – Bibliotek" };

  return {
    title: `${person.name} – Bibliotek`,
    description: `Lån, reservasjoner og rolle for ${person.name}`,
  };
}

/**
 * The person's loans as a table. Both cards on this page show the same row —
 * the history one adds the day the book went out, which is worth a column once
 * the list spans years but only repeats the status on the card above.
 */
function LoanTable({
  loans,
  showBorrowedAt = false,
}: {
  loans: LoanView[];
  showBorrowedAt?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <ColumnHead className="pl-(--card-spacing)">Bok</ColumnHead>
          {showBorrowedAt ? <ColumnHead>Lånt</ColumnHead> : null}
          <ColumnHead>Frist</ColumnHead>
          <ColumnHead className="pr-(--card-spacing)">Status</ColumnHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loans.map((loan) => (
          <TableRow key={loan.id}>
            <TableCell className={`py-3 pl-(--card-spacing) ${IDENTITY_CELL}`}>
              <RecordCell
                icon={Book02Icon}
                name={loan.book?.title ?? "Ukjent tittel"}
                href={loan.book ? `/boker/${loan.book.id}` : undefined}
              >
                {loan.book?.author}
              </RecordCell>
            </TableCell>
            {showBorrowedAt ? (
              <TableCell className="py-3 tabular-nums">
                {formatDate(loan.borrowedAt)}
              </TableCell>
            ) : null}
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
  );
}

export default async function BorrowerPage({
  params,
  searchParams,
}: PageProps<"/admin/brukere/[id]">) {
  const user = await requireBorrower();
  if (!isLibrarian(user)) {
    return (
      <>
        <PageHeading title="Bruker" />
        <LibrarianRequired user={user} />
      </>
    );
  }

  const { id } = await params;
  const [loans, reservations, borrowers, { feil, rolle }] = await Promise.all([
    listLoansForBorrower(id),
    listReservationsForBorrower(id),
    getBorrowers(),
    searchParams,
  ]);

  // Read out of the register we already fetched rather than asking for the one
  // person separately: every read is a full pass over the file, and this way
  // the person and the register `roleRefusal` judges them against cannot
  // disagree.
  const person = borrowers.find((borrower) => borrower.id === id);
  if (!person) notFound();

  const error = describeError(feil);

  const out = loans.filter((loan) => loan.status !== "returned");
  const overdue = loans.filter((loan) => loan.status === "overdue").length;
  const outstanding = outstandingFees(loans);

  const queued = reservations.filter(isOpen);
  const ready = queued.filter(
    (reservation) => reservation.status === "ready"
  ).length;

  // Only the way down can be refused, so that is the question worth asking.
  const refusal = roleRefusal(borrowers, person, "borrower", user.id);

  return (
    <>
      <Breadcrumbs
        trail={[
          { label: "Administrasjon", href: "/admin" },
          { label: "Brukere", href: "/admin/brukere" },
          { label: person.name },
        ]}
      />
      <PageHeading title={person.name}>{person.email}</PageHeading>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.description}</AlertDescription>
        </Alert>
      ) : null}

      {typeof rolle === "string" ? (
        <Alert className="mb-6">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
          <AlertTitle>
            {person.name} er nå{" "}
            {person.role === "librarian" ? "bibliotekar" : "vanlig låner"}
          </AlertTitle>
          <AlertDescription>
            {person.role === "librarian"
              ? "Personen ser administrasjonen og kan registrere retur og utlevering fra nå av."
              : "Personen ser bare sine egne lån nå, og kommer ikke lenger inn i administrasjonen."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Lånekortet</CardTitle>
          <CardDescription>
            Summen av alt som er registrert på personen. Tallene følger av lånene
            og endres ikke herfra.
          </CardDescription>
          <CardAction>
            <RoleBadge role={person.role} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 text-sm sm:grid-cols-3">
            <Fact label="Lån totalt">
              <span className="tabular-nums">{loans.length}</span>
            </Fact>
            <Fact label="Forsinket nå">
              {overdue === 0 ? (
                <span className="text-muted-foreground">Ingen</span>
              ) : (
                <span className="tabular-nums text-destructive">{overdue}</span>
              )}
            </Fact>
            <Fact label="Utestående gebyr">
              {outstanding === 0 ? (
                <span className="text-muted-foreground">Ingen gebyr</span>
              ) : (
                <span className="tabular-nums">{formatKroner(outstanding)}</span>
              )}
            </Fact>
          </dl>
        </CardContent>
      </Card>

      {/* Only worth a card once the person has borrowed something. With no
          loans at all the history below already says so, and two empty boxes
          saying the same thing is one too many. */}
      {loans.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bøker ute nå</CardTitle>
            <CardDescription>
              Eksemplarene {person.name} har hos seg, med fristen de skal
              leveres innen.
            </CardDescription>
            <CardAction>
              {overdue > 0 ? (
                <Badge variant="destructive">{overdue} forfalt</Badge>
              ) : (
                <Badge variant="secondary">{out.length} ute</Badge>
              )}
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {out.length === 0 ? (
              <p className="px-(--card-spacing) text-sm/relaxed text-muted-foreground">
                Ingen bøker er ute på lån akkurat nå.
              </p>
            ) : (
              <LoanTable loans={out} />
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* No empty state for this card: a reservation is made from a book page,
          so an empty box here would have nothing to offer. When the person has
          never been in a queue the card simply is not there. */}
      {reservations.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reservasjoner</CardTitle>
            <CardDescription>
              Titler {person.name} står i kø for, og køplasser som er avsluttet.
              Nyeste først.
            </CardDescription>
            <CardAction>
              {ready > 0 ? (
                <Badge>{ready} klar til henting</Badge>
              ) : queued.length > 0 ? (
                <Badge variant="secondary">{queued.length} i kø</Badge>
              ) : (
                <Badge variant="outline">Ingen i kø</Badge>
              )}
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <ColumnHead className="pl-(--card-spacing)">Tittel</ColumnHead>
                  <ColumnHead>Reservert</ColumnHead>
                  <ColumnHead className="pr-(--card-spacing)">Status</ColumnHead>
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
                    <TableCell className="py-3 pr-(--card-spacing)">
                      <ReservationStatusCell reservation={reservation} />
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
            <EmptyTitle>Ingen lån registrert</EmptyTitle>
            <EmptyDescription>
              {person.name} har ingen bøker ute og ingen lånehistorikk. Lån som
              registreres i skranken dukker opp her.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/admin" />}
            >
              Se aktive lån
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lånehistorikk</CardTitle>
            <CardDescription>
              Hele historikken, nyeste først. Gebyret er 10 kr for hver dag en
              bok er forsinket, og stopper på 200 kr.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <LoanTable loans={loans} showBorrowedAt />
          </CardContent>
        </Card>
      )}

      <Separator className="my-10" />

      <BorrowerRole
        borrowerId={person.id}
        name={person.name}
        role={person.role}
        refusal={refusal}
      />
    </>
  );
}
