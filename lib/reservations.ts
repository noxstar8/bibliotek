import {
  countActiveLoans,
  countHeldCopies,
  isActive,
  isOpen,
  isReady,
} from "@/lib/availability";
import type { Book, Database, Loan, Reservation } from "@/lib/types";

/**
 * The queue rules, and nothing else. This module never touches disk and never
 * calls the service layer — `lib/db.ts` runs {@link settleQueue} inside its own
 * writes, so anything imported the other way round would close a cycle.
 *
 * That constraint is also what makes the rules testable without a single mock:
 * every function here is a plain answer about a list of records.
 */

/* --------------------------------------------------------------- status --- */

export type ReservationStatus = "waiting" | "ready" | "fulfilled" | "cancelled";

export function getReservationStatus(reservation: Reservation): ReservationStatus {
  if (isOpen(reservation)) return reservation.readyAt === null ? "waiting" : "ready";
  return reservation.closedReason === "fulfilled" ? "fulfilled" : "cancelled";
}

/* ---------------------------------------------------------------- queue --- */

/** The queue for one title, oldest first — the order it is served in. */
export function queueFor(reservations: Reservation[], bookId: string): Reservation[] {
  return reservations
    .filter((reservation) => isOpen(reservation) && reservation.bookId === bookId)
    .sort((a, b) => a.reservedAt.localeCompare(b.reservedAt));
}

/**
 * A person's place in the queue, counting from 1. `0` when they are not in it.
 *
 * A reservation a copy has been put aside for still holds its place: it has not
 * left the queue until somebody collects the book.
 */
export function positionOf(
  reservations: Reservation[],
  bookId: string,
  borrowerId: string
): number {
  return (
    queueFor(reservations, bookId).findIndex(
      (reservation) => reservation.borrowerId === borrowerId
    ) + 1
  );
}

/** This person's open reservation on a title, if they have one. */
export function findOpenReservation(
  reservations: Reservation[],
  bookId: string,
  borrowerId: string
): Reservation | null {
  return (
    queueFor(reservations, bookId).find(
      (reservation) => reservation.borrowerId === borrowerId
    ) ?? null
  );
}

/** Whether this person has a copy of this title out right now. */
export function hasActiveLoanOn(
  loans: Loan[],
  bookId: string,
  borrowerId: string
): boolean {
  return loans.some(
    (loan) =>
      isActive(loan) && loan.bookId === bookId && loan.borrowerId === borrowerId
  );
}

/* ------------------------------------------------------------ promotion --- */

/**
 * The waiting reservations a freed copy should be put aside for, oldest first.
 *
 * Subtracting the copies already put aside is what makes this idempotent: run
 * it a second time and it promotes nobody. That is why every write which can
 * free a copy may call it without keeping track of whether it already has.
 */
export function reservationsToPromote(
  book: Book,
  loans: Loan[],
  reservations: Reservation[]
): Reservation[] {
  const free = Math.max(
    0,
    book.copies -
      countActiveLoans(loans, book.id) -
      countHeldCopies(reservations, book.id)
  );

  return queueFor(reservations, book.id)
    .filter((reservation) => reservation.readyAt === null)
    .slice(0, free);
}

/**
 * Puts every copy that is free right now aside for the next people in the
 * queue, and returns the reservations that got one.
 *
 * This mutates `database`, and is meant to be called inside the same queued
 * read-modify-write as the change that freed the copy — a return, or a
 * withdrawn hold. Doing it as a second write would leave a moment where the
 * copy reads as available and a passer-by could take it out from under the
 * person the queue exists to protect.
 */
export function settleQueue(
  database: Database,
  bookId: string,
  at: string
): Reservation[] {
  const book = database.books.find((candidate) => candidate.id === bookId);
  if (!book) return [];

  const promoted = reservationsToPromote(book, database.loans, database.reservations);
  for (const reservation of promoted) reservation.readyAt = at;

  return promoted;
}

/* ----------------------------------------------------------------- rules --- */

/** Why a person may not join the queue for a title. */
export type ReserveRefusal =
  | "copies-available"
  | "already-reserved"
  | "already-borrowed";

/** Everything a reservation command can fail with. */
export type ReservationError =
  | "book-not-found"
  | ReserveRefusal
  | "reservation-not-found"
  | "reservation-closed"
  | "reservation-not-ready"
  | "not-your-reservation";

/**
 * Why this person may not reserve this title, or `null` when they may.
 *
 * The order is deliberate. The two personal facts are stable and specific to
 * the reader; availability moves under them from one second to the next. Saying
 * "you already have this book out" is more use than "a copy is free" to someone
 * both are true of.
 */
export function reservationRefusal(
  book: Book,
  loans: Loan[],
  reservations: Reservation[],
  borrowerId: string
): ReserveRefusal | null {
  if (hasActiveLoanOn(loans, book.id, borrowerId)) return "already-borrowed";
  if (findOpenReservation(reservations, book.id, borrowerId)) return "already-reserved";

  // A title is only worth queueing for once the shelf is empty. Holds count
  // towards that: a copy waiting for somebody else is not one you can borrow.
  const free =
    book.copies -
    countActiveLoans(loans, book.id) -
    countHeldCopies(reservations, book.id);

  return free > 0 ? "copies-available" : null;
}

/**
 * Whether a copy can actually be handed over on this reservation right now.
 *
 * The copy put aside for *this* reservation is the one being lent out, so it
 * must not count against itself — only the holds belonging to other people do.
 *
 * A reservation that never became ready can still be collected when a copy is
 * free, which is what keeps the queue moving after a librarian raises the copy
 * count on a title people are already waiting for.
 */
export function canCollect(
  book: Book,
  loans: Loan[],
  reservations: Reservation[],
  reservation: Reservation
): boolean {
  if (!isOpen(reservation)) return false;

  const onShelf = book.copies - countActiveLoans(loans, book.id);
  const otherHolds =
    countHeldCopies(reservations, book.id) - (isReady(reservation) ? 1 : 0);

  return onShelf - otherHolds > 0;
}
