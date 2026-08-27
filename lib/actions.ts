"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  BORROWER_COOKIE,
  BORROWER_COOKIE_MAX_AGE,
  getCurrentBorrower,
  homePathFor,
  isLibrarian,
  SIGNED_OUT,
} from "@/lib/auth";
import { addBook, type BookError, editBook, parseBook, removeBook } from "@/lib/books";
import {
  createBorrower,
  DEMO_RESET_ENABLED,
  getBorrower,
  resetDatabase,
} from "@/lib/db";
import { errorSlug } from "@/lib/errors";
import type { BookProblem, BookState, BookValues, RegisterState } from "@/lib/forms";
import { borrowBook, registerReturn } from "@/lib/loans";
import type { Role } from "@/lib/types";

/** Every screen that shows a loan or an availability count. */
function revalidateLoanViews(bookId?: string) {
  revalidatePath("/");
  revalidatePath("/mine-laan");
  revalidatePath("/admin");
  if (bookId) revalidatePath(`/boker/${bookId}`);
}

/**
 * Every screen that names a title, after the catalogue entry itself moved.
 * Availability is only half of it now: the title, the author and the ISBN are
 * rendered into the boklist, the loan tables and the detail page as well.
 */
function revalidateCatalogue(bookId: string) {
  revalidateLoanViews(bookId);
  revalidatePath("/admin/boker");
  revalidatePath(`/admin/boker/${bookId}`);
}

/** Lends the book on the detail page to whoever is browsing. */
export async function borrowBookAction(formData: FormData) {
  const bookId = String(formData.get("bookId") ?? "");
  const borrower = await getCurrentBorrower();
  if (!borrower) redirect("/logg-inn");

  const result = await borrowBook(bookId, borrower.id);

  if (!result.ok) {
    redirect(`/boker/${encodeURIComponent(bookId)}?feil=${errorSlug(result.error)}`);
  }

  revalidateLoanViews(bookId);
  redirect("/mine-laan");
}

/** Takes a book back in from the administration screen. */
export async function returnLoanAction(formData: FormData) {
  const actor = await getCurrentBorrower();
  if (!actor || !isLibrarian(actor)) redirect("/logg-inn");

  const loanId = String(formData.get("loanId") ?? "");
  const result = await registerReturn(loanId);

  if (!result.ok) {
    redirect(`/admin?feil=${errorSlug(result.error)}`);
  }

  revalidateLoanViews(result.loan.bookId);
  redirect("/admin");
}

/**
 * Puts the demo back to the state in `data/seed.json`. Every loan, return and
 * enrolment registered since is discarded.
 *
 * This is demo plumbing, not desk work — but it is destructive, so it sits
 * behind the same librarian check as the rest of the administration, and behind
 * {@link DEMO_RESET_ENABLED} on top of that.
 */
export async function resetDemoDataAction() {
  if (!DEMO_RESET_ENABLED) redirect("/admin/innstillinger");

  const actor = await getCurrentBorrower();
  if (!actor || !isLibrarian(actor)) redirect("/logg-inn");

  await resetDatabase();

  revalidateLoanViews();
  // Every title at once — a reset changes availability across the catalogue,
  // not just on the one book a borrow would have touched.
  revalidatePath("/boker/[id]", "page");
  revalidatePath("/admin/boker");
  revalidatePath("/admin/boker/[id]", "page");
  revalidatePath("/admin/brukere");
  revalidatePath("/logg-inn");
  redirect("/admin/innstillinger?tilbakestilt=1");
}

/* ------------------------------------------------------------ katalogen --- */

/** The five catalogue fields, straight off the form and not yet parsed. */
function bookValues(formData: FormData): BookValues {
  return {
    title: String(formData.get("title") ?? ""),
    author: String(formData.get("author") ?? ""),
    isbn: String(formData.get("isbn") ?? ""),
    year: String(formData.get("year") ?? ""),
    copies: String(formData.get("copies") ?? ""),
  };
}

/**
 * Where a refused write lands in the form. Two of these belong to a field the
 * librarian can put right on the spot, so they are shown under it; a title that
 * disappeared from under them belongs to no field, and goes above them all.
 */
const bookProblems: Record<BookError, BookProblem> = {
  "isbn-taken": {
    field: "isbn",
    message: "En annen bok i katalogen har allerede dette ISBN-et.",
  },
  "copies-below-on-loan": {
    field: "copies",
    message:
      "Det er flere eksemplarer ute på lån enn dette. Registrer retur før du setter ned antallet.",
  },
  "book-on-loan": {
    field: "form",
    message:
      "Eksemplarer av boken er ute på lån, så den kan ikke tas ut av katalogen ennå.",
  },
  "book-not-found": {
    field: "form",
    message:
      "Boken står ikke i katalogen lenger. Noen kan ha slettet den mens du redigerte.",
  },
};

/** Puts a new title in the catalogue. */
export async function createBookAction(
  _previous: BookState,
  formData: FormData
): Promise<BookState> {
  const actor = await getCurrentBorrower();
  if (!actor || !isLibrarian(actor)) redirect("/logg-inn");

  const values = bookValues(formData);
  const parsed = parseBook(values);
  if (!parsed.ok) return { values, error: parsed.problem };

  const result = await addBook(parsed.book);
  if (!result.ok) return { values, error: bookProblems[result.error] };

  revalidateCatalogue(result.book.id);
  redirect(`/admin/boker?ny=${encodeURIComponent(result.book.id)}`);
}

/** Corrects an entry that is already in the catalogue. */
export async function updateBookAction(
  _previous: BookState,
  formData: FormData
): Promise<BookState> {
  const actor = await getCurrentBorrower();
  if (!actor || !isLibrarian(actor)) redirect("/logg-inn");

  const id = String(formData.get("bookId") ?? "");
  const values = bookValues(formData);
  const parsed = parseBook(values);
  if (!parsed.ok) return { values, error: parsed.problem };

  const result = await editBook(id, parsed.book);
  if (!result.ok) return { values, error: bookProblems[result.error] };

  revalidateCatalogue(id);
  redirect(`/admin/boker/${encodeURIComponent(id)}?lagret=1`);
}

/**
 * Takes a title out of the catalogue for good. Confirmed in a dialog before it
 * gets here, and refused outright while copies are still out on loan.
 */
export async function deleteBookAction(formData: FormData) {
  const actor = await getCurrentBorrower();
  if (!actor || !isLibrarian(actor)) redirect("/logg-inn");

  const id = String(formData.get("bookId") ?? "");
  const result = await removeBook(id);

  if (!result.ok) {
    // Back to the page the librarian was on, so the book they were looking at
    // is still in front of them when the reason turns up.
    redirect(
      `/admin/boker/${encodeURIComponent(id)}?feil=${errorSlug(result.error)}`
    );
  }

  revalidateCatalogue(id);
  redirect(`/admin/boker?slettet=${encodeURIComponent(result.book.title)}`);
}

/* ----------------------------------------------------------------- who am I --- */

/**
 * Becomes the chosen person. Stands in for a login: the demo has no passwords,
 * so picking a name from the register is the whole of it.
 */
export async function signInAction(formData: FormData) {
  const id = String(formData.get("borrowerId") ?? "");
  const borrower = await getBorrower(id);
  if (!borrower) redirect("/logg-inn?feil=ukjent-laaner");

  (await cookies()).set(BORROWER_COOKIE, borrower.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: BORROWER_COOKIE_MAX_AGE,
  });

  redirect(homePathFor(borrower));
}

/**
 * Marks the session as signed out. Writes a sentinel rather than deleting the
 * cookie — a deleted cookie is indistinguishable from a first visit, which the
 * seed fallback turns straight back into the first borrower.
 */
export async function signOutAction() {
  (await cookies()).set(BORROWER_COOKIE, SIGNED_OUT, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: BORROWER_COOKIE_MAX_AGE,
  });

  redirect("/logg-inn");
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Enrols a new person in the register. This is desk work — a librarian signing
 * someone up — not self-service registration, so it survives the move to real
 * authentication.
 */
export async function registerBorrowerAction(
  _previous: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const actor = await getCurrentBorrower();
  if (!actor || !isLibrarian(actor)) redirect("/logg-inn");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role: Role = formData.get("role") === "librarian" ? "librarian" : "borrower";
  const values = { name, email, role };

  if (name === "") {
    return { values, error: { field: "name", message: "Skriv inn navnet på låneren." } };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return {
      values,
      error: { field: "email", message: "Skriv en gyldig e-postadresse." },
    };
  }

  const borrower = await createBorrower({ name, email, role });

  if (!borrower) {
    return {
      values,
      error: {
        field: "email",
        message: "Adressen er allerede i bruk av en annen låner.",
      },
    };
  }

  revalidatePath("/admin/brukere");
  revalidatePath("/logg-inn");
  redirect(`/admin/brukere?ny=${encodeURIComponent(borrower.id)}`);
}
