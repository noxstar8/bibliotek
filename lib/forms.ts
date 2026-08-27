import type { Role } from "@/lib/types";

/**
 * The state the enrolment form hands back to itself between submissions: which
 * field was wrong, and what was typed, so nothing is lost on a rejection.
 */
export type RegisterState = {
  error?: { field: "name" | "email"; message: string };
  values?: { name: string; email: string; role: Role };
};

export const emptyRegisterState: RegisterState = {};

/**
 * The catalogue form, exactly as it comes off the wire: five strings, none of
 * them trimmed or parsed yet. `year` and `copies` are numbers in the model, but
 * they are not numbers while they are being typed — keeping them as strings is
 * what lets a rejected form show back what was written rather than a 0.
 */
export type BookValues = {
  title: string;
  author: string;
  isbn: string;
  year: string;
  copies: string;
};

export type BookField = keyof BookValues;

/**
 * Why a book was not saved. `"form"` is for the failures that belong to no
 * single field — the title having been deleted from under the librarian, say —
 * and those are shown above the fields instead of under one.
 */
export type BookProblem = { field: BookField | "form"; message: string };

/** The same bargain as {@link RegisterState}, for the catalogue form. */
export type BookState = {
  error?: BookProblem;
  values?: BookValues;
};

export const emptyBookState: BookState = {};
