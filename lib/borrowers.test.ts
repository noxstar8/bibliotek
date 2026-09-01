import { describe, expect, it } from "vitest";

import { countLibrarians, roleRefusal, wouldOrphanAdmin } from "@/lib/borrowers";
import type { Borrower } from "@/lib/types";

function borrower(id: string, role: Borrower["role"] = "borrower"): Borrower {
  return { id, name: `Person ${id}`, email: `${id}@example.no`, role };
}

/** One librarian and one plain borrower — the smallest register with both. */
const marit = borrower("marit", "librarian");
const jonas = borrower("jonas");

describe("countLibrarians", () => {
  it("counts only the librarians", () => {
    expect(countLibrarians([marit, jonas, borrower("ida", "librarian")])).toBe(2);
  });

  it("is nothing for an empty register", () => {
    expect(countLibrarians([])).toBe(0);
  });
});

describe("wouldOrphanAdmin", () => {
  it("is true when the only librarian steps down", () => {
    expect(wouldOrphanAdmin([marit, jonas], "marit", "borrower")).toBe(true);
  });

  it("is false when one of two steps down", () => {
    const ida = borrower("ida", "librarian");
    expect(wouldOrphanAdmin([marit, ida, jonas], "marit", "borrower")).toBe(false);
  });

  it("is false when a borrower is promoted", () => {
    expect(wouldOrphanAdmin([marit, jonas], "jonas", "librarian")).toBe(false);
  });

  it("is false when a librarian is set to librarian again", () => {
    expect(wouldOrphanAdmin([marit, jonas], "marit", "librarian")).toBe(false);
  });

  it("is false for a register that already has no librarian", () => {
    // A degenerate register is not made any worse by this write.
    expect(wouldOrphanAdmin([jonas], "jonas", "borrower")).toBe(false);
  });

  it("does not care who is pressing the button", () => {
    // The self-demotion hazard is a separate rule with a separate remedy. This
    // one is about the register, so it answers the same either way.
    expect(wouldOrphanAdmin([marit, jonas], "marit", "borrower")).toBe(true);
  });
});

describe("roleRefusal", () => {
  it("refuses a librarian stepping down themselves", () => {
    const ida = borrower("ida", "librarian");
    expect(roleRefusal([marit, ida, jonas], marit, "borrower", "marit")).toBe(
      "cannot-demote-self"
    );
  });

  it("refuses demoting the last librarian", () => {
    // Nobody else could be doing this in the app, but a stale form could.
    expect(roleRefusal([marit, jonas], marit, "borrower", "jonas")).toBe(
      "last-librarian"
    );
  });

  it("names the self-demotion first when both rules apply", () => {
    expect(roleRefusal([marit, jonas], marit, "borrower", "marit")).toBe(
      "cannot-demote-self"
    );
  });

  it("allows one of two librarians to demote the other", () => {
    const ida = borrower("ida", "librarian");
    expect(roleRefusal([marit, ida, jonas], ida, "borrower", "marit")).toBeNull();
  });

  it("allows promoting a borrower", () => {
    expect(roleRefusal([marit, jonas], jonas, "librarian", "marit")).toBeNull();
  });

  it("allows promoting yourself", () => {
    // Not reachable from the interface, but the rule only ever guards demotion.
    expect(roleRefusal([marit, jonas], jonas, "librarian", "jonas")).toBeNull();
  });

  it("allows setting the role it already has", () => {
    expect(roleRefusal([marit, jonas], marit, "librarian", "marit")).toBeNull();
    expect(roleRefusal([marit, jonas], jonas, "borrower", "marit")).toBeNull();
  });
});
