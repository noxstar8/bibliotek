import {
  countActiveLoans,
  countAvailableCopies,
  countHeldCopies,
  isActive,
  isBookAvailable,
  isOpen,
} from "@/lib/availability";
import { addDays, daysBetween, type DateInput } from "@/lib/dates";
import * as db from "@/lib/db";
import { calculateLateFee, daysOverdue } from "@/lib/fees";
import {
  canCollect,
  getReservationStatus,
  positionOf,
  queueFor,
  type ReservationError,
  type ReservationStatus,
  reservationRefusal,
  type ReserveRefusal,
  settleQueue,
} from "@/lib/reservations";
import type { Book, Borrower, Loan, Reservation } from "@/lib/types";

/** How long a loan runs, from the day it is taken out. */
export const LOAN_PERIOD_DAYS = 28;

export function dueDateFor(borrowedAt: DateInput): Date {
  return addDays(borrowedAt, LOAN_PERIOD_DAYS);
}

/* --------------------------------------------------------------- status --- */

export type LoanStatus = "active" | "overdue" | "returned";

export function getLoanStatus(loan: Loan, today: DateInput): LoanStatus {
  if (!isActive(loan)) return "returned";
  return daysOverdue(loan, today) > 0 ? "overdue" : "active";
}

/** A loan with everything a screen or an API response needs to describe it. */
export type LoanView = Loan & {
  status: LoanStatus;
  daysOverdue: number;
  daysRemaining: number;
  lateFee: number;
  book: Book | null;
  borrower: Borrower | null;
};

function toLoanView(
  loan: Loan,
  today: DateInput,
  books: Book[],
  borrowers: Borrower[]
): LoanView {
  return {
    ...loan,
    status: getLoanStatus(loan, today),
    daysOverdue: daysOverdue(loan, today),
    daysRemaining: Math.max(0, daysBetween(today, loan.dueAt)),
    lateFee: calculateLateFee(loan, today),
    book: books.find((book) => book.id === loan.bookId) ?? null,
    borrower: borrowers.find((borrower) => borrower.id === loan.borrowerId) ?? null,
  };
}

async function describe(loans: Loan[], today: DateInput): Promise<LoanView[]> {
  const [books, borrowers] = await Promise.all([db.getBooks(), db.getBorrowers()]);
  return loans.map((loan) => toLoanView(loan, today, books, borrowers));
}

/* --------------------------------------------------------- availability --- */

/** A book plus how many copies are on the shelf right now. */
export type BookView = Book & {
  /** Copies a borrower can take right now. */
  available: number;
  /** Copies out with a borrower. */
  onLoan: number;
  /** Copies in the building but put aside on the pickup shelf. */
  held: number;
  /** People in the queue, waiting and ready together. */
  reserved: number;
};

function toBookView(book: Book, loans: Loan[], reservations: Reservation[]): BookView {
  return {
    ...book,
    available: countAvailableCopies(book, loans, reservations),
    // Counted straight, not as `copies - available`: that subtraction would
    // fold the copies on the pickup shelf into "out on loan", and they are the
    // one thing this page has to keep apart.
    onLoan: countActiveLoans(loans, book.id),
    held: countHeldCopies(reservations, book.id),
    reserved: queueFor(reservations, book.id).length,
  };
}

export async function listBooks(): Promise<BookView[]> {
  const [books, loans, reservations] = await Promise.all([
    db.getBooks(),
    db.getLoans(),
    db.getReservations(),
  ]);

  return books.map((book) => toBookView(book, loans, reservations));
}

export async function findBook(id: string): Promise<BookView | null> {
  const book = await db.getBook(id);
  if (!book) return null;

  const [loans, reservations] = await Promise.all([
    db.getLoans(),
    db.getReservations(),
  ]);

  return toBookView(book, loans, reservations);
}

/** The active loans on one title, so a detail page can say when a copy is back. */
export async function listActiveLoansForBook(
  id: string,
  today: DateInput = new Date()
): Promise<LoanView[]> {
  const loans = await db.getActiveLoans();
  return describe(
    loans.filter((loan) => loan.bookId === id),
    today
  );
}

/* --------------------------------------------------------------- queries --- */

export async function listLoansForBorrower(
  borrowerId: string,
  today: DateInput = new Date()
): Promise<LoanView[]> {
  return describe(await db.getLoansForBorrower(borrowerId), today);
}

/**
 * What a person still owes: the late fees on the books they have not handed
 * back.
 *
 * Returned loans are left out on purpose. Their fee is frozen on the day the
 * book came back, and nothing in the model records a payment — counting them
 * would give a figure that no librarian could ever clear.
 */
export function outstandingFees(loans: LoanView[]): number {
  return loans
    .filter((loan) => loan.status !== "returned")
    .reduce((sum, loan) => sum + loan.lateFee, 0);
}

export async function listActiveLoans(today: DateInput = new Date()): Promise<LoanView[]> {
  return describe(await db.getActiveLoans(), today);
}

/* -------------------------------------------------------------- commands --- */

export type LoanError =
  | "book-not-found"
  | "no-copies-available"
  | "loan-not-found"
  | "already-returned";

export type LoanResult =
  | { ok: true; loan: Loan }
  | { ok: false; error: LoanError };

/**
 * Lends out a copy of `bookId` to `borrowerId` for the standard loan period.
 * Fails when the title is unknown or every copy is already out.
 */
export async function borrowBook(
  bookId: string,
  borrowerId: string,
  now: Date = new Date()
): Promise<LoanResult> {
  const book = await db.getBook(bookId);
  if (!book) return { ok: false, error: "book-not-found" };

  const loan = await db.createLoan(
    {
      bookId,
      borrowerId,
      borrowedAt: now.toISOString(),
      dueAt: dueDateFor(now).toISOString(),
    },
    // Re-checked against the state the write itself sees, so two borrowers
    // cannot take the last copy at the same moment. Copies put aside for a
    // reservation do not count as available, which is what stops this lending
    // out the book somebody is already standing in the queue for.
    (database) => {
      const current = database.books.find((candidate) => candidate.id === bookId);
      return (
        current !== undefined &&
        isBookAvailable(current, database.loans, database.reservations)
      );
    }
  );

  if (!loan) return { ok: false, error: "no-copies-available" };
  return { ok: true, loan };
}

/** A registered return, and the reservations the freed copy went to. */
export type ReturnResult =
  | { ok: true; loan: Loan; promoted: Reservation[] }
  | { ok: false; error: LoanError };

/**
 * Takes a book back into the collection.
 *
 * If anybody is waiting for the title, the copy is put aside for the first of
 * them as part of the same write — see {@link db.markLoanReturned}.
 */
export async function registerReturn(
  loanId: string,
  now: Date = new Date()
): Promise<ReturnResult> {
  const existing = await db.getLoan(loanId);
  if (!existing) return { ok: false, error: "loan-not-found" };
  if (!isActive(existing)) return { ok: false, error: "already-returned" };

  const outcome = await db.markLoanReturned(loanId, now.toISOString(), (database, loan) =>
    settleQueue(database, loan.bookId, now.toISOString())
  );

  if (!outcome) return { ok: false, error: "loan-not-found" };
  return { ok: true, loan: outcome.loan, promoted: outcome.promoted };
}

/* ---------------------------------------------------------- reservations --- */

export type ReservationResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; error: ReservationError };

/** A reservation with everything a screen or an API response needs to describe it. */
export type ReservationView = Reservation & {
  status: ReservationStatus;
  /** Place in the queue, counting from 1. `0` once it has left the queue. */
  position: number;
  /** Whether a copy is in the building to hand over on this reservation now. */
  collectable: boolean;
  book: Book | null;
  borrower: Borrower | null;
};

async function describeReservations(
  reservations: Reservation[]
): Promise<ReservationView[]> {
  const [books, borrowers, loans, all] = await Promise.all([
    db.getBooks(),
    db.getBorrowers(),
    db.getLoans(),
    db.getReservations(),
  ]);

  return reservations.map((reservation) => {
    const book = books.find((candidate) => candidate.id === reservation.bookId) ?? null;

    return {
      ...reservation,
      status: getReservationStatus(reservation),
      position: positionOf(all, reservation.bookId, reservation.borrowerId),
      collectable: book !== null && canCollect(book, loans, all, reservation),
      book,
      borrower:
        borrowers.find((borrower) => borrower.id === reservation.borrowerId) ?? null,
    };
  });
}

export async function listReservationsForBorrower(
  borrowerId: string
): Promise<ReservationView[]> {
  return describeReservations(await db.getReservationsForBorrower(borrowerId));
}

export async function listReservationsForBook(
  bookId: string
): Promise<ReservationView[]> {
  return describeReservations(await db.getReservationsForBook(bookId));
}

/**
 * The whole queue for the desk: the copies waiting to be picked up first, then
 * the longest wait. A book on the pickup shelf is the one thing here a
 * librarian can act on, so it goes at the top.
 */
export async function listOpenReservations(): Promise<ReservationView[]> {
  const reservations = (await db.getReservations()).filter(isOpen);
  const views = await describeReservations(reservations);

  return views.sort((a, b) => {
    if (a.status !== b.status) return a.status === "ready" ? -1 : 1;
    return a.reservedAt.localeCompare(b.reservedAt);
  });
}

/** This person's open reservation on a title, if they are in its queue. */
export async function findReservationForBorrower(
  bookId: string,
  borrowerId: string
): Promise<ReservationView | null> {
  const views = await describeReservations(await db.getReservationsForBook(bookId));

  return (
    views.find(
      (reservation) => reservation.borrowerId === borrowerId && isOpen(reservation)
    ) ?? null
  );
}

/**
 * Puts a person in the queue for a title where every copy is out.
 *
 * The rules are re-run inside the write, against the database it sees, so a
 * copy handed back a moment earlier turns this down rather than parking
 * somebody in a queue for a book they could have walked off with.
 */
export async function reserveBook(
  bookId: string,
  borrowerId: string,
  now: Date = new Date()
): Promise<ReservationResult> {
  const book = await db.getBook(bookId);
  if (!book) return { ok: false, error: "book-not-found" };

  // A boolean precondition would only say *that* a rule bit, and the three
  // reasons need three different answers. Collected on the way through and read
  // back after, the same way `editBook` does it.
  const refused: ReserveRefusal[] = [];

  const reservation = await db.createReservation(
    { bookId, borrowerId, reservedAt: now.toISOString() },
    (database) => {
      const current = database.books.find((candidate) => candidate.id === bookId);
      if (!current) return false;

      const refusal = reservationRefusal(
        current,
        database.loans,
        database.reservations,
        borrowerId
      );
      if (refusal) refused.push(refusal);

      return refusal === null;
    }
  );

  if (!reservation) return { ok: false, error: refused.at(0) ?? "book-not-found" };
  return { ok: true, reservation };
}

/**
 * Takes a reservation out of the queue.
 *
 * `ownerId` is the person the reservation must belong to. A librarian clearing
 * the queue at the desk passes `null`, which skips that check — theirs is the
 * only case where withdrawing somebody else's place is the job.
 */
export async function cancelReservation(
  reservationId: string,
  ownerId: string | null,
  now: Date = new Date()
): Promise<ReservationResult> {
  const existing = await db.getReservation(reservationId);
  if (!existing) return { ok: false, error: "reservation-not-found" };
  if (!isOpen(existing)) return { ok: false, error: "reservation-closed" };
  if (ownerId !== null && existing.borrowerId !== ownerId) {
    return { ok: false, error: "not-your-reservation" };
  }

  const refused: ReservationError[] = [];

  const reservation = await db.closeReservation(
    reservationId,
    now.toISOString(),
    "cancelled",
    (_database, candidate) => {
      if (!isOpen(candidate)) refused.push("reservation-closed");
      if (ownerId !== null && candidate.borrowerId !== ownerId) {
        refused.push("not-your-reservation");
      }

      return refused.length === 0;
    },
    // A withdrawn hold has just released a copy. It has to reach the next
    // person in the queue in this same write, or it briefly reads as free.
    (database, candidate) => settleQueue(database, candidate.bookId, now.toISOString())
  );

  if (!reservation) {
    return { ok: false, error: refused.at(0) ?? "reservation-not-found" };
  }

  return { ok: true, reservation };
}

/** The handover at the desk: a reserved copy becomes an ordinary loan. */
export async function collectReservation(
  reservationId: string,
  now: Date = new Date()
): Promise<{ ok: true; loan: Loan; reservation: Reservation } | { ok: false; error: ReservationError }> {
  const existing = await db.getReservation(reservationId);
  if (!existing) return { ok: false, error: "reservation-not-found" };
  if (!isOpen(existing)) return { ok: false, error: "reservation-closed" };

  const refused: ReservationError[] = [];

  const outcome = await db.collectReservation(
    reservationId,
    { borrowedAt: now.toISOString(), dueAt: dueDateFor(now).toISOString() },
    (database, candidate) => {
      const book = database.books.find((item) => item.id === candidate.bookId);
      if (!book) {
        refused.push("book-not-found");
        return false;
      }

      if (!isOpen(candidate)) refused.push("reservation-closed");
      else if (!canCollect(book, database.loans, database.reservations, candidate)) {
        refused.push("reservation-not-ready");
      }

      return refused.length === 0;
    }
  );

  if (!outcome) return { ok: false, error: refused.at(0) ?? "reservation-not-found" };
  return { ok: true, loan: outcome.loan, reservation: outcome.reservation };
}
