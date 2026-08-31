/** The domain model. Every date is a full ISO 8601 timestamp in UTC. */

export type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  year: number;
  copies: number;
};

/**
 * What a person is allowed to do. A librarian is still a borrower — the role
 * only adds the desk work on top, so both live in the same register.
 */
export type Role = "borrower" | "librarian";

export type Borrower = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Loan = {
  id: string;
  bookId: string;
  borrowerId: string;
  borrowedAt: string;
  dueAt: string;
  /** `null` while the book is still out. */
  returnedAt: string | null;
};

/**
 * A place in the queue for a title where every copy is out.
 *
 * Like a loan, this carries its whole life in nullable timestamps rather than a
 * status field: `readyAt` is set when a returned copy is put aside for it, and
 * `closedAt` when it leaves the queue. The status is read back off them.
 *
 * `readyAt` is stored rather than worked out, because the sum runs the other
 * way: a copy put aside is not available, so availability depends on the hold.
 * Deriving the hold from availability instead would make the two circular.
 */
export type Reservation = {
  id: string;
  bookId: string;
  borrowerId: string;
  reservedAt: string;
  /**
   * When a copy was put aside on the pickup shelf. `null` while still waiting.
   * Nothing expires it: a copy stays put aside until it is collected or the
   * reservation is withdrawn.
   */
  readyAt: string | null;
  /** `null` while the reservation is still in the queue. */
  closedAt: string | null;
  /** How it left the queue. `null` while it is still in it. */
  closedReason: "fulfilled" | "cancelled" | null;
};

/** The shape of `data/seed.json` and `data/db.json`. */
export type Database = {
  books: Book[];
  borrowers: Borrower[];
  loans: Loan[];
  reservations: Reservation[];
};
