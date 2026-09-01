import * as db from "@/lib/db";
import type { Borrower, Role } from "@/lib/types";

/**
 * The register itself: who a person is allowed to be.
 *
 * Loans and reservations are the desk work, and live elsewhere. This module is
 * about the accounts they hang off, and at the moment that is one rule — the
 * administration must not be able to lock itself out.
 */

/* ----------------------------------------------------------------- rules --- */

/** How many librarians the register has left. */
export function countLibrarians(borrowers: Borrower[]): number {
  return borrowers.filter((borrower) => borrower.role === "librarian").length;
}

/**
 * Whether this change would leave the register without a single librarian.
 *
 * About the register, not about who is pressing the button: taking the keys off
 * yourself is a separate rule, because it has a separate remedy. This one has
 * none — with no librarian left, nothing in the app can hand the role back, and
 * `data/db.json` would have to be edited by hand.
 */
export function wouldOrphanAdmin(
  borrowers: Borrower[],
  id: string,
  role: Role
): boolean {
  const target = borrowers.find((borrower) => borrower.id === id);
  if (!target || target.role !== "librarian" || role === "librarian") return false;

  return countLibrarians(borrowers) <= 1;
}

export type BorrowerError =
  | "borrower-not-found"
  | "cannot-demote-self"
  | "last-librarian";

export type BorrowerResult =
  | { ok: true; borrower: Borrower }
  | { ok: false; error: BorrowerError };

/**
 * The refusals a screen can work out in advance, before anything is submitted.
 *
 * Narrower than {@link BorrowerError}: a person who is not in the register at
 * all cannot be the one whose card you are looking at, so that case only ever
 * comes back from the write.
 */
export type RoleRefusal = Extract<
  BorrowerError,
  "cannot-demote-self" | "last-librarian"
>;

/**
 * Why the role cannot be set, or `null` when it can.
 *
 * Two things are guarded, and only ever on the way *down*. Promoting somebody
 * is always safe — it can be undone by anyone the promotion just created.
 *
 * Self-demotion is refused rather than confirmed: the librarian is standing on a
 * page only librarians can open, so the next render would take it away from
 * them, and in a deployment with real accounts there would be no "switch user"
 * to climb back through. Asking somebody else to do it costs one conversation
 * and cannot strand anyone.
 */
export function roleRefusal(
  borrowers: Borrower[],
  target: Borrower,
  role: Role,
  actorId: string
): RoleRefusal | null {
  if (role === "librarian" || target.role !== "librarian") return null;

  if (target.id === actorId) return "cannot-demote-self";
  if (wouldOrphanAdmin(borrowers, target.id, role)) return "last-librarian";

  return null;
}

/* -------------------------------------------------------------- commands --- */

/**
 * Makes a person a librarian, or puts them back to being a plain borrower.
 *
 * The rules are re-run inside the queued write, against the register that write
 * itself sees — the other librarian may have been demoted in another tab since
 * this page was drawn. A boolean precondition would only say *that* a rule bit,
 * and the two reasons need two different answers, so the refusal is collected on
 * the way through and read back after, the same way `editBook` does it.
 */
export async function setBorrowerRole(
  id: string,
  role: Role,
  actorId: string
): Promise<BorrowerResult> {
  const refused: BorrowerError[] = [];

  const borrower = await db.updateBorrowerRole(id, role, (database, current) => {
    const refusal = roleRefusal(database.borrowers, current, role, actorId);
    if (refusal) refused.push(refusal);

    return refusal === null;
  });

  // An empty `refused` means the precondition never ran: the person was already
  // gone from the register.
  if (!borrower) return { ok: false, error: refused.at(0) ?? "borrower-not-found" };
  return { ok: true, borrower };
}
