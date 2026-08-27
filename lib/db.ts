import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { isActive } from "@/lib/availability";
import { sameIsbn } from "@/lib/isbn";
import type { Book, Borrower, Database, Loan } from "@/lib/types";

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

async function read(): Promise<Database> {
  try {
    const database = JSON.parse(await readFile(DB_FILE, "utf8")) as Database;
    // A working copy written before roles existed would otherwise leave every
    // person role-less. Reading it as a plain borrower keeps it usable.
    for (const borrower of database.borrowers) borrower.role ??= "borrower";
    return database;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;

    const seed = JSON.parse(await readFile(SEED_FILE, "utf8")) as Database;
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
 */
export async function deleteBook(
  id: string,
  precondition: (database: Database, book: Book) => boolean = () => true
): Promise<Book | null> {
  return enqueue(async () => {
    const database = await read();
    const index = database.books.findIndex((candidate) => candidate.id === id);

    if (index === -1) return null;

    const book = database.books[index];
    if (!precondition(database, book)) return null;

    database.books.splice(index, 1);
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

/**
 * Stamps a loan as returned. Returns the updated loan, or `null` if no loan has
 * that id. A loan that was already returned keeps its original return date.
 */
export async function markLoanReturned(
  id: string,
  returnedAt: string
): Promise<Loan | null> {
  return enqueue(async () => {
    const database = await read();
    const loan = database.loans.find((candidate) => candidate.id === id);

    if (!loan) return null;
    if (loan.returnedAt !== null) return loan;

    loan.returnedAt = returnedAt;
    await write(database);
    return loan;
  });
}
