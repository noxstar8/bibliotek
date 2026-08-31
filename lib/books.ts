import { countActiveLoans, countHeldCopies } from "@/lib/availability";
import * as db from "@/lib/db";
import type { BookProblem, BookValues } from "@/lib/forms";
import { isValidIsbn, sameIsbn } from "@/lib/isbn";
import type { Book, Database } from "@/lib/types";

/**
 * The catalogue side of the desk work: putting a title in, correcting one, and
 * taking one out. Reading the catalogue lives in `lib/loans.ts`, where
 * availability is worked out — a title is never interesting on its own, only
 * next to the copies that are out.
 */

/** Roughly Gutenberg. Anything older is a typo, not a holding. */
const EARLIEST_YEAR = 1450;

/** No public library holds a thousand copies of one title. Catches a slipped digit. */
const MOST_COPIES = 999;

/* ------------------------------------------------------------ validation --- */

export type ParsedBook =
  | { ok: true; book: db.NewBook }
  | { ok: false; problem: BookProblem };

/**
 * Turns what was typed into a catalogue entry, or says which field to go back
 * to. One problem at a time, in reading order: a form that lights up five
 * errors at once tells a librarian less than the first one does.
 */
export function parseBook(values: BookValues, today: Date = new Date()): ParsedBook {
  const title = values.title.trim();
  const author = values.author.trim();
  const isbn = values.isbn.trim();
  const year = Number(values.year.trim());
  const copies = Number(values.copies.trim());

  // A title published ahead of its imprint year is normal, so next year counts.
  const latestYear = today.getUTCFullYear() + 1;

  if (title === "") {
    return { ok: false, problem: { field: "title", message: "Skriv inn tittelen på boken." } };
  }

  if (author === "") {
    return {
      ok: false,
      problem: { field: "author", message: "Skriv inn hvem som har skrevet boken." },
    };
  }

  if (!isValidIsbn(isbn)) {
    return {
      ok: false,
      problem: {
        field: "isbn",
        message: "Skriv et ISBN med 10 eller 13 siffer. Bindestreker kan stå.",
      },
    };
  }

  if (!Number.isInteger(year) || year < EARLIEST_YEAR || year > latestYear) {
    return {
      ok: false,
      problem: {
        field: "year",
        message: `Skriv et utgivelsesår mellom ${EARLIEST_YEAR} og ${latestYear}.`,
      },
    };
  }

  if (!Number.isInteger(copies) || copies < 1 || copies > MOST_COPIES) {
    return {
      ok: false,
      problem: {
        field: "copies",
        message: `Skriv hvor mange eksemplarer biblioteket har, fra 1 til ${MOST_COPIES}.`,
      },
    };
  }

  return { ok: true, book: { title, author, isbn, year, copies } };
}

/* -------------------------------------------------------------- commands --- */

export type BookError =
  | "book-not-found"
  | "isbn-taken"
  | "copies-below-on-loan"
  | "book-on-loan";

export type BookResult = { ok: true; book: Book } | { ok: false; error: BookError };

/** Whether some *other* title already carries this number. */
function isbnTaken(database: Database, isbn: string, exceptId: string): boolean {
  return database.books.some(
    (book) => book.id !== exceptId && sameIsbn(book.isbn, isbn)
  );
}

/** Puts a new title in the catalogue. */
export async function addBook(input: db.NewBook): Promise<BookResult> {
  const book = await db.createBook(input);
  if (!book) return { ok: false, error: "isbn-taken" };

  return { ok: true, book };
}

/**
 * Corrects the catalogue entry for `id`.
 *
 * Both rules are checked inside the queued write, against the catalogue as it
 * stands at that moment — the copy count in particular is only meaningful next
 * to the loans, and those move while a form is open. A boolean precondition
 * would say no more than *that* one of them failed, so the reason is collected
 * on the way through and read back afterwards. An empty `refused` therefore
 * means the precondition never ran: the title was already gone.
 */
export async function editBook(id: string, changes: db.NewBook): Promise<BookResult> {
  const refused: BookError[] = [];

  const book = await db.updateBook(id, changes, (database, current) => {
    if (isbnTaken(database, changes.isbn, current.id)) refused.push("isbn-taken");

    // Copies on the pickup shelf are spoken for just as firmly as ones on loan:
    // somebody is coming in for them. Counting only the loans would let the
    // stock be cut out from under a reservation.
    const committed =
      countActiveLoans(database.loans, current.id) +
      countHeldCopies(database.reservations, current.id);

    if (changes.copies < committed) refused.push("copies-below-on-loan");

    return refused.length === 0;
  });

  if (!book) return { ok: false, error: refused.at(0) ?? "book-not-found" };
  return { ok: true, book };
}

/**
 * Takes a title out of the catalogue.
 *
 * A copy that is out on loan is owed back to the library, and the borrower is
 * owed a title to hand it back against — so the entry stays until every copy is
 * in. Loans of the title that are already settled are left standing, while
 * anyone still queueing for it has their reservation withdrawn.
 */
export async function removeBook(
  id: string,
  now: Date = new Date()
): Promise<BookResult> {
  const refused: BookError[] = [];

  const book = await db.deleteBook(id, now.toISOString(), (database, current) => {
    if (countActiveLoans(database.loans, current.id) > 0) refused.push("book-on-loan");

    return refused.length === 0;
  });

  if (!book) return { ok: false, error: refused.at(0) ?? "book-not-found" };
  return { ok: true, book };
}
