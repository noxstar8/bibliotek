import { describe, expect, it } from "vitest";

import {
  canCollect,
  findOpenReservation,
  getReservationStatus,
  positionOf,
  queueFor,
  reservationRefusal,
  reservationsToPromote,
  settleQueue,
} from "@/lib/reservations";
import type { Book, Database, Loan, Reservation } from "@/lib/types";

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

function loan(bookId: string, borrowerId = "borrower-1", returnedAt: string | null = null): Loan {
  counter += 1;
  return {
    id: `loan-${counter}`,
    bookId,
    borrowerId,
    borrowedAt: "2026-02-01T12:00:00.000Z",
    dueAt: "2026-03-01T12:00:00.000Z",
    returnedAt,
  };
}

type ReservationOptions = {
  reservedAt?: string;
  readyAt?: string | null;
  closedReason?: "fulfilled" | "cancelled";
};

function reservation(
  bookId: string,
  borrowerId: string,
  { reservedAt = "2026-02-01T12:00:00.000Z", readyAt = null, closedReason }: ReservationOptions = {}
): Reservation {
  counter += 1;
  return {
    id: `reservation-${counter}`,
    bookId,
    borrowerId,
    reservedAt,
    readyAt,
    closedAt: closedReason ? "2026-02-20T12:00:00.000Z" : null,
    closedReason: closedReason ?? null,
  };
}

const READY_AT = "2026-02-10T12:00:00.000Z";

describe("getReservationStatus", () => {
  it("is waiting while nothing has been put aside", () => {
    expect(getReservationStatus(reservation("book-1", "borrower-1"))).toBe("waiting");
  });

  it("is ready once a copy is put aside", () => {
    const held = reservation("book-1", "borrower-1", { readyAt: READY_AT });
    expect(getReservationStatus(held)).toBe("ready");
  });

  it("tells a collected reservation from a withdrawn one", () => {
    const collected = reservation("book-1", "borrower-1", { closedReason: "fulfilled" });
    const withdrawn = reservation("book-1", "borrower-1", { closedReason: "cancelled" });

    expect(getReservationStatus(collected)).toBe("fulfilled");
    expect(getReservationStatus(withdrawn)).toBe("cancelled");
  });

  it("is closed even when a copy had been put aside", () => {
    const collected = reservation("book-1", "borrower-1", {
      readyAt: READY_AT,
      closedReason: "fulfilled",
    });

    expect(getReservationStatus(collected)).toBe("fulfilled");
  });
});

describe("queueFor", () => {
  it("puts the oldest reservation first, whatever order they are stored in", () => {
    const reservations = [
      reservation("book-1", "borrower-2", { reservedAt: "2026-02-05T12:00:00.000Z" }),
      reservation("book-1", "borrower-1", { reservedAt: "2026-02-01T12:00:00.000Z" }),
    ];

    expect(queueFor(reservations, "book-1").map((r) => r.borrowerId)).toEqual([
      "borrower-1",
      "borrower-2",
    ]);
  });

  it("leaves out reservations that have left the queue", () => {
    const reservations = [
      reservation("book-1", "borrower-1", { closedReason: "fulfilled" }),
      reservation("book-1", "borrower-2"),
    ];

    expect(queueFor(reservations, "book-1")).toHaveLength(1);
  });

  it("ignores reservations on other titles", () => {
    expect(queueFor([reservation("book-2", "borrower-1")], "book-1")).toEqual([]);
  });
});

describe("positionOf", () => {
  it("counts from 1", () => {
    const reservations = [
      reservation("book-1", "borrower-1", { reservedAt: "2026-02-01T12:00:00.000Z" }),
      reservation("book-1", "borrower-2", { reservedAt: "2026-02-05T12:00:00.000Z" }),
    ];

    expect(positionOf(reservations, "book-1", "borrower-1")).toBe(1);
    expect(positionOf(reservations, "book-1", "borrower-2")).toBe(2);
  });

  it("keeps the place of a reservation a copy is put aside for", () => {
    const reservations = [
      reservation("book-1", "borrower-1", {
        reservedAt: "2026-02-01T12:00:00.000Z",
        readyAt: READY_AT,
      }),
      reservation("book-1", "borrower-2", { reservedAt: "2026-02-05T12:00:00.000Z" }),
    ];

    expect(positionOf(reservations, "book-1", "borrower-1")).toBe(1);
    expect(positionOf(reservations, "book-1", "borrower-2")).toBe(2);
  });

  it("moves everyone up when the person in front leaves the queue", () => {
    const reservations = [
      reservation("book-1", "borrower-1", {
        reservedAt: "2026-02-01T12:00:00.000Z",
        closedReason: "cancelled",
      }),
      reservation("book-1", "borrower-2", { reservedAt: "2026-02-05T12:00:00.000Z" }),
    ];

    expect(positionOf(reservations, "book-1", "borrower-2")).toBe(1);
  });

  it("does not count a queue on another title", () => {
    const reservations = [
      reservation("book-2", "borrower-9", { reservedAt: "2026-01-01T12:00:00.000Z" }),
      reservation("book-1", "borrower-1", { reservedAt: "2026-02-01T12:00:00.000Z" }),
    ];

    expect(positionOf(reservations, "book-1", "borrower-1")).toBe(1);
  });

  it("is 0 for somebody who is not in the queue", () => {
    expect(positionOf([reservation("book-1", "borrower-1")], "book-1", "borrower-9")).toBe(0);
  });
});

describe("findOpenReservation", () => {
  it("finds this person's place in the queue", () => {
    const reservations = [reservation("book-1", "borrower-1")];
    expect(findOpenReservation(reservations, "book-1", "borrower-1")).not.toBeNull();
  });

  it("does not find one that has left the queue", () => {
    const reservations = [
      reservation("book-1", "borrower-1", { closedReason: "cancelled" }),
    ];

    expect(findOpenReservation(reservations, "book-1", "borrower-1")).toBeNull();
  });
});

describe("reservationsToPromote", () => {
  it("puts a freed copy aside for the person at the head of the queue", () => {
    const reservations = [
      reservation("book-1", "borrower-1", { reservedAt: "2026-02-01T12:00:00.000Z" }),
      reservation("book-1", "borrower-2", { reservedAt: "2026-02-05T12:00:00.000Z" }),
    ];

    const promoted = reservationsToPromote(book(1), [], reservations);

    expect(promoted.map((r) => r.borrowerId)).toEqual(["borrower-1"]);
  });

  it("promotes nobody while every copy is still out", () => {
    const reservations = [reservation("book-1", "borrower-1")];
    expect(reservationsToPromote(book(1), [loan("book-1")], reservations)).toEqual([]);
  });

  it("promotes nobody when the queue is empty", () => {
    expect(reservationsToPromote(book(2), [], [])).toEqual([]);
  });

  it("promotes two people when two copies come free at once", () => {
    const reservations = [
      reservation("book-1", "borrower-1", { reservedAt: "2026-02-01T12:00:00.000Z" }),
      reservation("book-1", "borrower-2", { reservedAt: "2026-02-05T12:00:00.000Z" }),
      reservation("book-1", "borrower-3", { reservedAt: "2026-02-06T12:00:00.000Z" }),
    ];

    const promoted = reservationsToPromote(book(2), [], reservations);

    expect(promoted.map((r) => r.borrowerId)).toEqual(["borrower-1", "borrower-2"]);
  });

  it("does not treat a copy already put aside for somebody else as free", () => {
    const reservations = [
      reservation("book-1", "borrower-1", {
        reservedAt: "2026-02-01T12:00:00.000Z",
        readyAt: READY_AT,
      }),
      reservation("book-1", "borrower-2", { reservedAt: "2026-02-05T12:00:00.000Z" }),
    ];

    expect(reservationsToPromote(book(1), [], reservations)).toEqual([]);
  });

  it("promotes nobody a second time once the copy is put aside", () => {
    const reservations = [
      reservation("book-1", "borrower-1", { reservedAt: "2026-02-01T12:00:00.000Z" }),
    ];

    const first = reservationsToPromote(book(1), [], reservations);
    for (const promoted of first) promoted.readyAt = READY_AT;

    expect(first).toHaveLength(1);
    expect(reservationsToPromote(book(1), [], reservations)).toEqual([]);
  });

  it("ignores loans and queues on other titles", () => {
    const reservations = [
      reservation("book-2", "borrower-9", { reservedAt: "2026-01-01T12:00:00.000Z" }),
      reservation("book-1", "borrower-1", { reservedAt: "2026-02-01T12:00:00.000Z" }),
    ];

    const promoted = reservationsToPromote(book(1), [loan("book-2")], reservations);

    expect(promoted.map((r) => r.borrowerId)).toEqual(["borrower-1"]);
  });

  it("promotes nobody for a title with no copies at all", () => {
    expect(reservationsToPromote(book(0), [], [reservation("book-1", "borrower-1")])).toEqual(
      []
    );
  });
});

describe("settleQueue", () => {
  function database(books: Book[], loans: Loan[], reservations: Reservation[]): Database {
    return { books, borrowers: [], loans, reservations };
  }

  it("stamps the freed copy with the time it was put aside", () => {
    const waiting = reservation("book-1", "borrower-1");
    const db = database([book(1)], [], [waiting]);

    const promoted = settleQueue(db, "book-1", READY_AT);

    expect(promoted).toHaveLength(1);
    expect(waiting.readyAt).toBe(READY_AT);
  });

  it("leaves the queue alone while every copy is out", () => {
    const waiting = reservation("book-1", "borrower-1");
    const db = database([book(1)], [loan("book-1")], [waiting]);

    expect(settleQueue(db, "book-1", READY_AT)).toEqual([]);
    expect(waiting.readyAt).toBeNull();
  });

  it("does nothing for a title that is no longer in the catalogue", () => {
    const db = database([], [], [reservation("book-1", "borrower-1")]);
    expect(settleQueue(db, "book-1", READY_AT)).toEqual([]);
  });
});

describe("reservationRefusal", () => {
  it("allows a queue when every copy is out", () => {
    expect(reservationRefusal(book(1), [loan("book-1")], [], "borrower-2")).toBeNull();
  });

  it("refuses while a copy is on the shelf", () => {
    expect(reservationRefusal(book(2), [loan("book-1")], [], "borrower-2")).toBe(
      "copies-available"
    );
  });

  it("refuses a second reservation on the same title", () => {
    const reservations = [reservation("book-1", "borrower-2")];

    expect(
      reservationRefusal(book(1), [loan("book-1")], reservations, "borrower-2")
    ).toBe("already-reserved");
  });

  it("refuses a title the person already has out", () => {
    const loans = [loan("book-1", "borrower-2")];
    expect(reservationRefusal(book(1), loans, [], "borrower-2")).toBe("already-borrowed");
  });

  it("allows a queue once the person's own earlier loan is returned", () => {
    const loans = [
      loan("book-1", "borrower-2", "2026-02-08T12:00:00.000Z"),
      loan("book-1", "borrower-1"),
    ];

    expect(reservationRefusal(book(1), loans, [], "borrower-2")).toBeNull();
  });

  it("lets a second person queue behind a copy put aside for somebody else", () => {
    const reservations = [
      reservation("book-1", "borrower-1", { readyAt: READY_AT }),
    ];

    expect(reservationRefusal(book(1), [], reservations, "borrower-2")).toBeNull();
  });

  it("names the personal reason first when more than one applies", () => {
    const loans = [loan("book-1", "borrower-2")];
    const reservations = [reservation("book-1", "borrower-2")];

    expect(reservationRefusal(book(2), loans, reservations, "borrower-2")).toBe(
      "already-borrowed"
    );
  });
});

describe("canCollect", () => {
  it("hands over the copy that was put aside for this reservation", () => {
    const held = reservation("book-1", "borrower-1", { readyAt: READY_AT });
    expect(canCollect(book(1), [], [held], held)).toBe(true);
  });

  it("refuses while the copy is still out on loan", () => {
    const waiting = reservation("book-1", "borrower-1");
    expect(canCollect(book(1), [loan("book-1")], [waiting], waiting)).toBe(false);
  });

  it("hands over a free copy even to a reservation nothing was put aside for", () => {
    const waiting = reservation("book-1", "borrower-1");
    expect(canCollect(book(2), [loan("book-1")], [waiting], waiting)).toBe(true);
  });

  it("does not take a copy put aside for somebody else", () => {
    const held = reservation("book-1", "borrower-1", { readyAt: READY_AT });
    const waiting = reservation("book-1", "borrower-2", {
      reservedAt: "2026-02-05T12:00:00.000Z",
    });

    expect(canCollect(book(1), [], [held, waiting], waiting)).toBe(false);
  });

  it("refuses a reservation that has already left the queue", () => {
    const collected = reservation("book-1", "borrower-1", {
      readyAt: READY_AT,
      closedReason: "fulfilled",
    });

    expect(canCollect(book(1), [], [collected], collected)).toBe(false);
  });
});
