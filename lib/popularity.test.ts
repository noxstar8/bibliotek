import { describe, expect, it } from "vitest";

import { byPopularity, countLoans } from "@/lib/popularity";
import type { Loan } from "@/lib/types";

function loan(bookId: string, overrides: Partial<Loan> = {}): Loan {
  return {
    id: `loan-${Math.random()}`,
    bookId,
    borrowerId: "borrower-1",
    borrowedAt: "2026-02-01T12:00:00.000Z",
    dueAt: "2026-03-01T12:00:00.000Z",
    returnedAt: null,
    ...overrides,
  };
}

const returned = (bookId: string) =>
  loan(bookId, { returnedAt: "2026-02-10T12:00:00.000Z" });

describe("countLoans", () => {
  it("is zero for a title nobody has borrowed", () => {
    expect(countLoans([loan("book-1")], "book-2")).toBe(0);
  });

  it("counts every loan on the title", () => {
    const loans = [loan("book-1"), loan("book-1"), loan("book-2")];
    expect(countLoans(loans, "book-1")).toBe(2);
  });

  it("counts returned loans too — the tally is the whole history", () => {
    const loans = [returned("book-1"), returned("book-1"), loan("book-1")];
    expect(countLoans(loans, "book-1")).toBe(3);
  });
});

describe("byPopularity", () => {
  const books = [{ id: "book-1" }, { id: "book-2" }, { id: "book-3" }];

  it("puts the most borrowed title first", () => {
    const loans = [loan("book-3"), loan("book-2"), loan("book-2")];
    expect(byPopularity(books, loans).map((book) => book.id)).toEqual([
      "book-2",
      "book-3",
    ]);
  });

  it("leaves out titles nobody has borrowed", () => {
    const result = byPopularity(books, [loan("book-1")]);
    expect(result.map((book) => book.id)).toEqual(["book-1"]);
  });

  it("is empty when there are no loans at all", () => {
    expect(byPopularity(books, [])).toEqual([]);
  });

  it("ranks a returned title above one that is merely out right now", () => {
    const loans = [returned("book-3"), returned("book-3"), loan("book-1")];
    expect(byPopularity(books, loans).map((book) => book.id)).toEqual([
      "book-3",
      "book-1",
    ]);
  });

  it("keeps the incoming order between titles with the same count", () => {
    const loans = [loan("book-3"), loan("book-1")];
    expect(byPopularity(books, loans).map((book) => book.id)).toEqual([
      "book-1",
      "book-3",
    ]);
  });

  it("does not modify the array it was given", () => {
    const original = [...books];
    byPopularity(books, [loan("book-3")]);
    expect(books).toEqual(original);
  });
});
