import type { Loan } from "@/lib/types";

/**
 * How often each title has been borrowed, and nothing else. Like the other
 * rule modules this never touches disk and never calls a service — it is a
 * plain answer about a list of loans, so it tests without a single mock.
 */

/**
 * How many times `bookId` has been borrowed, over the whole history.
 *
 * Returned loans count. A tally of only the active ones would measure which
 * copies happen to be out this afternoon, not which titles people keep asking
 * for — and a popular book that everybody returns on time would rank below one
 * nobody has finished.
 */
export function countLoans(loans: Loan[], bookId: string): number {
  return loans.filter((loan) => loan.bookId === bookId).length;
}

/**
 * Titles ordered by how often they have been borrowed, most first.
 *
 * Books nobody has ever borrowed are dropped rather than sorted to the back: a
 * row called "most borrowed" that runs on into titles with no loans at all is
 * padding the list with the opposite of what it promises.
 *
 * Ties keep the order they came in — the caller's order is a real one (the
 * catalogue's), so a coin toss between two titles with three loans each would
 * only make the row unstable between renders.
 */
export function byPopularity<T extends { id: string }>(
  books: T[],
  loans: Loan[]
): T[] {
  return books
    .map((book) => ({ book, count: countLoans(loans, book.id) }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((entry) => entry.book);
}
