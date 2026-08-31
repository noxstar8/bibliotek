import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { isActive, isOpen } from "@/lib/availability";
import { sameIsbn } from "@/lib/isbn";
import type { Book, Borrower, Database, Loan, Reservation } from "@/lib/types";

/**
 * The only module that touches disk. Everything else goes through these
 * functions.
 *
 * `data/seed.json` is committed and never written to. `data/db.json` is the
 * working copy: it is created from the seed the first time anything is read,
 * and is the file every write lands in.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const SEED_FILE = path.join(DATA_DIR, "seed.json");
const DB_FILE = path.join(DATA_DIR, "db.json");

/**
 * Writes are read-modify-write, so two overlapping borrows would otherwise be
 * able to lose one another. Chaining every operation onto one promise keeps
 * them strictly sequential.
 */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(operation, operation);
  // Keep the chain alive even if this operation rejects.
  queue = result.catch(() => undefined);
  return result;
}

/**
 * Fills in what an older working copy was written without. A `db.json` from
 * before a field existed would otherwise arrive half-shaped, and every screen
 * reading that field would have to cope with it being missing.
 */
function migrate(database: Database): Database {
  // Written before roles existed: reading everyone as a plain borrower keeps
  // the file usable.
  for (const borrower of database.borrowers) borrower.role ??= "borrower";
  // Written before reservations existed: no queue at all, not an empty one.
  database.reservations ??= [];

  return database;
}

async function read(): Promise<Database> {
  try {
    return migrate(JSON.parse(await readFile(DB_FILE, "utf8")) as Database);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;

    const seed = migrate(JSON.parse(await readFile(SEED_FILE, "utf8")) as Database);
    await write(seed);
    return seed;
  }
}

async function write(database: Database): Promise<void> {
  await writeFile(DB_FILE, `${JSON.stringify(database, null, 2)}\n`, "utf8");
}

/* ---------------------------------------------------------------- reads ---
   Reads go through the same queue as writes so that nothing ever reads a file
   that is half-written. */

export async function getBooks(): Promise<Book[]> {
  return enqueue(async () => (await read()).books);
}

export async function getBook(id: string): Promise<Book | null> {
  const books = await getBooks();
  return books.find((book) => book.id === id) ?? null;
}

export async function getBorrowers(): Promise<Borrower[]> {
  return enqueue(async () => (await read()).borrowers);
}

export async function getBorrower(id: string): Promise<Borrower | null> {
  const borrowers = await getBorrowers();
  return borrowers.find((borrower) => borrower.id === id) ?? null;
}

/** Every loan ever registered — needed to work out availability. */
export async function getLoans(): Promise<Loan[]> {
  return enqueue(async () => (await read()).loans);
}

/** One borrower's loans, current and historic, newest first. */
export async function getLoansForBorrower(borrowerId: string): Promise<Loan[]> {
  const loans = await getLoans();
  return loans
    .filter((loan) => loan.borrowerId === borrowerId)
    .sort((a, b) => b.borrowedAt.localeCompare(a.borrowedAt));
}

/** Every loan that has not been returned yet, oldest due date first. */
export async function getActiveLoans(): Promise<Loan[]> {
  const loans = await getLoans();
  return loans.filter(isActive).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export async function getLoan(id: string): Promise<Loan | null> {
  const loans = await getLoans();
  return loans.find((loan) => loan.id === id) ?? null;
}

/** Every reservation ever made, open and closed. */
export async function getReservations(): Promise<Reservation[]> {
  return enqueue(async () => (await read()).reservations);
}

export async function getReservation(id: string): Promise<Reservation | null> {
  const reservations = await getReservations();
  return reservations.find((reservation) => reservation.id === id) ?? null;
}

/** One title's queue, current and historic, oldest reservation first. */
export async function getReservationsForBook(bookId: string): Promise<Reservation[]> {
  const reservations = await getReservations();
  return reservations
    .filter((reservation) => reservation.bookId === bookId)
    .sort((a, b) => a.reservedAt.localeCompare(b.reservedAt));
}

/** One person's reservations, current and historic, newest first. */
export async function getReservationsForBorrower(
  borrowerId: string
): Promise<Reservation[]> {
  const reservations = await getReservations();
  return reservations
    .filter((reservation) => reservation.borrowerId === borrowerId)
    .sort((a, b) => b.reservedAt.localeCompare(a.reservedAt));
}

/* --------------------------------------------------------------- writes --- */

export type NewLoan = Omit<Loan, "id" | "returnedAt">;

/**
 * Registers a loan and returns it.
 *
 * `precondition` is checked against the database inside the same queued
 * operation as the write, so a rule that depends on the current state — such as
 * "a copy must still be on the shelf" — cannot be overtaken by a loan
 * registered a moment earlier. Returns `null` when it fails.
 */
export async function createLoan(
  input: NewLoan,
  precondition: (database: Database) => boolean = () => true
): Promise<Loan | null> {
  return enqueue(async () => {
    const database = await read();
    if (!precondition(database)) return null;

    const loan: Loan = { id: `loan-${randomUUID()}`, ...input, returnedAt: null };

    database.loans.push(loan);
    await write(database);
    return loan;
  });
}

export type NewBorrower = Omit<Borrower, "id">;

/**
 * Enrols a person in the register. Returns `null` when the email is already
 * taken — checked inside the queued write, so two enrolments cannot slip past
 * one another.
 */
export async function createBorrower(input: NewBorrower): Promise<Borrower | null> {
  return enqueue(async () => {
    const database = await read();
    const taken = database.borrowers.some(
      (borrower) => borrower.email.toLowerCase() === input.email.toLowerCase()
    );
    if (taken) return null;

    // "laaner-", not "borrower-": this id lands in a URL after enrolment, and
    // URLs in this app are Norwegian.
    const borrower: Borrower = { id: `laaner-${randomUUID()}`, ...input };

    database.borrowers.push(borrower);
    await write(database);
    return borrower;
  });
}

export type NewBook = Omit<Book, "id">;

/**
 * Puts a title in the catalogue. Returns `null` when the ISBN already belongs
 * to another title — checked inside the queued write, so two entries of the
 * same book cannot slip past one another.
 */
export async function createBook(input: NewBook): Promise<Book | null> {
  return enqueue(async () => {
    const database = await read();
    if (database.books.some((book) => sameIsbn(book.isbn, input.isbn))) return null;

    // "bok-", not "book-": this id lands in a URL once the title is saved, and
    // URLs in this app are Norwegian.
    const book: Book = { id: `bok-${randomUUID()}`, ...input };

    database.books.push(book);
    await write(database);
    return book;
  });
}

/**
 * Rewrites the catalogue entry for `id` and returns it. `null` when no title
 * has that id, or when `precondition` turns the change down.
 *
 * The precondition sees the whole database alongside the entry as it stands,
 * because the rules worth enforcing here are about the state around the record
 * — "a copy cannot be struck off the catalogue while it is out on loan" — and
 * that state can change between reading the form and writing it back.
 */
export async function updateBook(
  id: string,
  changes: NewBook,
  precondition: (database: Database, book: Book) => boolean = () => true
): Promise<Book | null> {
  return enqueue(async () => {
    const database = await read();
    const book = database.books.find((candidate) => candidate.id === id);

    if (!book) return null;
    if (!precondition(database, book)) return null;

    Object.assign(book, changes);
    await write(database);
    return book;
  });
}

/**
 * Takes a title out of the catalogue and returns the entry that was removed.
 * `null` when no title has that id, or when `precondition` turns it down.
 *
 * Loans are deliberately left alone. A loan is the record of something that
 * happened, and it stays true after the title leaves the collection — every
 * screen that shows one already copes with the book being gone.
 *
 * Open reservations go the other way, and are withdrawn along with the title. A
 * reservation is not a record of anything: it is a promise to hand over a copy
 * of a book that no longer exists, and leaving one standing would keep it in
 * somebody's queue for good.
 */
export async function deleteBook(
  id: string,
  closedAt: string,
  precondition: (database: Database, book: Book) => boolean = () => true
): Promise<Book | null> {
  return enqueue(async () => {
    const database = await read();
    const index = database.books.findIndex((candidate) => candidate.id === id);

    if (index === -1) return null;

    const book = database.books[index];
    if (!precondition(database, book)) return null;

    database.books.splice(index, 1);
    for (const reservation of database.reservations) {
      if (reservation.bookId === id && isOpen(reservation)) {
        reservation.closedAt = closedAt;
        reservation.closedReason = "cancelled";
      }
    }

    await write(database);
    return book;
  });
}

/**
 * Whether the demo data may be reset from the interface.
 *
 * On in development. Off in production unless deliberately switched on with
 * `ALLOW_DEMO_RESET=true` — deployed, this button lets any visitor wipe the
 * demo for everyone else, so it is not something to ship by accident.
 */
export const DEMO_RESET_ENABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.ALLOW_DEMO_RESET === "true";

/**
 * Puts the working copy back to `data/seed.json`.
 *
 * `scripts/reset-data.mjs` deletes the file and lets the next read rebuild it.
 * That is fine from a cold terminal, but not from a running server: it goes
 * through the same queue as everything else here, so a reset cannot land in the
 * middle of a borrow and leave it writing into a database that no longer
 * matches what its precondition saw.
 */
export async function resetDatabase(): Promise<void> {
  return enqueue(async () => {
    const seed = JSON.parse(await readFile(SEED_FILE, "utf8")) as Database;
    await write(seed);
  });
}

/** A registered return, and who the freed copy was put aside for. */
export type ReturnOutcome = { loan: Loan; promoted: Reservation[] };

/**
 * Stamps a loan as returned and, in the same write, hands the freed copy to
 * whoever `settle` says should have it. Returns `null` if no loan has that id.
 * A loan that was already returned keeps its original return date.
 *
 * `settle` runs inside the queued operation, on the database as it stands with
 * the return already applied, and is where `lib/reservations.ts` puts the copy
 * aside. Doing that as a second write would leave a moment where the copy reads
 * as available, and a passer-by could borrow it out from under the person at
 * the head of the queue.
 */
export async function markLoanReturned(
  id: string,
  returnedAt: string,
  settle: (database: Database, loan: Loan) => Reservation[] = () => []
): Promise<ReturnOutcome | null> {
  return enqueue(async () => {
    const database = await read();
    const loan = database.loans.find((candidate) => candidate.id === id);

    if (!loan) return null;
    if (loan.returnedAt !== null) return { loan, promoted: [] };

    loan.returnedAt = returnedAt;
    const promoted = settle(database, loan);

    await write(database);
    return { loan, promoted };
  });
}

export type NewReservation = Omit<
  Reservation,
  "id" | "readyAt" | "closedAt" | "closedReason"
>;

/**
 * Puts a person in the queue for a title.
 *
 * `precondition` is checked against the database inside the same queued
 * operation as the write, so "every copy must still be out" cannot be overtaken
 * by a return registered a moment earlier. Returns `null` when it fails.
 */
export async function createReservation(
  input: NewReservation,
  precondition: (database: Database) => boolean = () => true
): Promise<Reservation | null> {
  return enqueue(async () => {
    const database = await read();
    if (!precondition(database)) return null;

    const reservation: Reservation = {
      id: `reservation-${randomUUID()}`,
      ...input,
      readyAt: null,
      closedAt: null,
      closedReason: null,
    };

    database.reservations.push(reservation);
    await write(database);
    return reservation;
  });
}

/**
 * Takes a reservation out of the queue and returns it. `null` when no
 * reservation has that id, or when `precondition` turns it down.
 *
 * `settle` runs afterwards, in the same write: a reservation that was holding a
 * copy has just released it, and it has to reach the next person in the queue
 * before anyone else can see it on the shelf.
 */
export async function closeReservation(
  id: string,
  closedAt: string,
  closedReason: "fulfilled" | "cancelled",
  precondition: (database: Database, reservation: Reservation) => boolean = () => true,
  settle: (database: Database, reservation: Reservation) => Reservation[] = () => []
): Promise<Reservation | null> {
  return enqueue(async () => {
    const database = await read();
    const reservation = database.reservations.find(
      (candidate) => candidate.id === id
    );

    if (!reservation) return null;
    if (!precondition(database, reservation)) return null;

    reservation.closedAt = closedAt;
    reservation.closedReason = closedReason;
    settle(database, reservation);

    await write(database);
    return reservation;
  });
}

/**
 * The handover at the desk: the copy becomes an ordinary loan and the
 * reservation leaves the queue, in one write.
 *
 * Two writes would open a moment where the reservation had released its copy
 * but the loan did not exist yet — exactly long enough for someone else to
 * borrow the book the person at the counter is standing there for.
 *
 * `dates` rather than a timestamp because the loan period is a rule, and rules
 * live outside this module.
 */
export async function collectReservation(
  id: string,
  dates: { borrowedAt: string; dueAt: string },
  precondition: (database: Database, reservation: Reservation) => boolean = () => true
): Promise<{ reservation: Reservation; loan: Loan } | null> {
  return enqueue(async () => {
    const database = await read();
    const reservation = database.reservations.find(
      (candidate) => candidate.id === id
    );

    if (!reservation) return null;
    if (!precondition(database, reservation)) return null;

    const loan: Loan = {
      id: `loan-${randomUUID()}`,
      bookId: reservation.bookId,
      borrowerId: reservation.borrowerId,
      ...dates,
      returnedAt: null,
    };

    database.loans.push(loan);
    reservation.closedAt = dates.borrowedAt;
    reservation.closedReason = "fulfilled";

    await write(database);
    return { reservation, loan };
  });
}
