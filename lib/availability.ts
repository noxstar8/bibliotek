import type { Book, Loan, Reservation } from "@/lib/types";

/** A loan is active until the book is handed back. */
export function isActive(loan: Loan): boolean {
  return loan.returnedAt === null;
}

/** How many copies of `bookId` are out right now. */
export function countActiveLoans(loans: Loan[], bookId: string): number {
  return loans.filter((loan) => isActive(loan) && loan.bookId === bookId).length;
}

/** A reservation is open until it is collected or withdrawn. */
export function isOpen(reservation: Reservation): boolean {
  return reservation.closedAt === null;
}

/** An open reservation that a copy has already been put aside for. */
export function isReady(reservation: Reservation): boolean {
  return isOpen(reservation) && reservation.readyAt !== null;
}

/**
 * How many copies of `bookId` are on the pickup shelf: in the building, but
 * spoken for by whoever is at the head of the queue.
 */
export function countHeldCopies(
  reservations: Reservation[],
  bookId: string
): number {
  return reservations.filter(
    (reservation) => isReady(reservation) && reservation.bookId === bookId
  ).length;
}

/**
 * Copies a borrower can actually take: the total, minus the ones on loan, minus
 * the ones put aside for a reservation. Clamped at zero so a catalogue error
 * (more loans than copies) never reads as negative stock.
 *
 * `reservations` is required rather than defaulted. A caller who forgot it
 * would get a count that is too high and lend out a copy somebody is already
 * standing in the queue for — the one mistake this whole rule exists to stop.
 */
export function countAvailableCopies(
  book: Book,
  loans: Loan[],
  reservations: Reservation[]
): number {
  return Math.max(
    0,
    book.copies -
      countActiveLoans(loans, book.id) -
      countHeldCopies(reservations, book.id)
  );
}

/** Whether the book can be borrowed at all. */
export function isBookAvailable(
  book: Book,
  loans: Loan[],
  reservations: Reservation[]
): boolean {
  return countAvailableCopies(book, loans, reservations) > 0;
}
