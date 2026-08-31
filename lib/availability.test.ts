import { describe, expect, it } from "vitest";

import {
  countActiveLoans,
  countAvailableCopies,
  countHeldCopies,
  isBookAvailable,
} from "@/lib/availability";
import type { Book, Loan, Reservation } from "@/lib/types";

function book(copies: number, id = "book-1"): Book {
  return {
    id,
    title: "Sult",
    author: "Knut Hamsun",
    isbn: "978-82-05-39001-4",
    year: 1890,
    copies,
  };
}

let counter = 0;

function loan(bookId: string, returnedAt: string | null = null): Loan {
  counter += 1;
  return {
    id: `loan-${counter}`,
    bookId,
    borrowerId: "borrower-1",
    borrowedAt: "2026-02-01T12:00:00.000Z",
    dueAt: "2026-03-01T12:00:00.000Z",
    returnedAt,
  };
}

function reservation(
  bookId: string,
  { ready = false, closed = false }: { ready?: boolean; closed?: boolean } = {}
): Reservation {
  counter += 1;
  return {
    id: `reservation-${counter}`,
    bookId,
    borrowerId: "borrower-2",
    reservedAt: "2026-02-01T12:00:00.000Z",
    readyAt: ready ? "2026-02-10T12:00:00.000Z" : null,
    closedAt: closed ? "2026-02-12T12:00:00.000Z" : null,
    closedReason: closed ? "cancelled" : null,
  };
}

describe("countActiveLoans", () => {
  it("counts only loans that have not been returned", () => {
    const loans = [
      loan("book-1"),
      loan("book-1", "2026-02-10T12:00:00.000Z"),
      loan("book-1"),
    ];

    expect(countActiveLoans(loans, "book-1")).toBe(2);
  });

  it("ignores loans on other titles", () => {
    expect(countActiveLoans([loan("book-2"), loan("book-3")], "book-1")).toBe(0);
  });
});

describe("countHeldCopies", () => {
  it("counts the reservations a copy has been put aside for", () => {
    const reservations = [
      reservation("book-1", { ready: true }),
      reservation("book-1"),
      reservation("book-1", { ready: true }),
    ];

    expect(countHeldCopies(reservations, "book-1")).toBe(2);
  });

  it("does not count a reservation that has left the queue", () => {
    const reservations = [reservation("book-1", { ready: true, closed: true })];
    expect(countHeldCopies(reservations, "book-1")).toBe(0);
  });

  it("ignores reservations on other titles", () => {
    expect(countHeldCopies([reservation("book-2", { ready: true })], "book-1")).toBe(0);
  });
});

describe("countAvailableCopies", () => {
  it("is the full stock when nothing is out", () => {
    expect(countAvailableCopies(book(4), [], [])).toBe(4);
  });

  it("subtracts every active loan", () => {
    const loans = [loan("book-1"), loan("book-1")];
    expect(countAvailableCopies(book(4), loans, [])).toBe(2);
  });

  it("gives a copy back when a loan is returned", () => {
    const loans = [loan("book-1"), loan("book-1", "2026-02-10T12:00:00.000Z")];
    expect(countAvailableCopies(book(2), loans, [])).toBe(1);
  });

  it("is zero when every copy is out", () => {
    expect(countAvailableCopies(book(1), [loan("book-1")], [])).toBe(0);
  });

  it("never goes negative if more loans than copies were registered", () => {
    const loans = [loan("book-1"), loan("book-1"), loan("book-1")];
    expect(countAvailableCopies(book(1), loans, [])).toBe(0);
  });

  it("is not affected by loans on other titles", () => {
    expect(countAvailableCopies(book(2), [loan("book-2")], [])).toBe(2);
  });

  it("subtracts a copy put aside for a reservation", () => {
    const reservations = [reservation("book-1", { ready: true })];
    expect(countAvailableCopies(book(2), [], reservations)).toBe(1);
  });

  it("counts a copy still on the shelf even though someone is waiting", () => {
    expect(countAvailableCopies(book(2), [], [reservation("book-1")])).toBe(2);
  });

  it("is zero when the one spare copy is put aside", () => {
    const loans = [loan("book-1")];
    const reservations = [reservation("book-1", { ready: true })];

    expect(countAvailableCopies(book(2), loans, reservations)).toBe(0);
  });

  it("is not affected by a copy put aside on another title", () => {
    const reservations = [reservation("book-2", { ready: true })];
    expect(countAvailableCopies(book(2), [], reservations)).toBe(2);
  });

  it("never goes negative when loans and holds together exceed the stock", () => {
    const loans = [loan("book-1")];
    const reservations = [
      reservation("book-1", { ready: true }),
      reservation("book-1", { ready: true }),
    ];

    expect(countAvailableCopies(book(1), loans, reservations)).toBe(0);
  });
});

describe("isBookAvailable", () => {
  it("is true while a copy is on the shelf", () => {
    expect(isBookAvailable(book(2), [loan("book-1")], [])).toBe(true);
  });

  it("is false once the last copy is lent out", () => {
    expect(isBookAvailable(book(1), [loan("book-1")], [])).toBe(false);
  });

  it("is false for a title with no copies at all", () => {
    expect(isBookAvailable(book(0), [], [])).toBe(false);
  });

  it("is false when the last copy is on the pickup shelf", () => {
    expect(isBookAvailable(book(1), [], [reservation("book-1", { ready: true })])).toBe(
      false
    );
  });
});
