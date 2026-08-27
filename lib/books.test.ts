import { describe, expect, it } from "vitest";

import { parseBook } from "@/lib/books";
import type { BookValues } from "@/lib/forms";
import { isValidIsbn, normalizeIsbn, sameIsbn } from "@/lib/isbn";

/** The form filled in correctly, so each test can spoil one field at a time. */
function values(overrides: Partial<BookValues> = {}): BookValues {
  return {
    title: "Sult",
    author: "Knut Hamsun",
    isbn: "978-82-05-38001-2",
    year: "1890",
    copies: "3",
    ...overrides,
  };
}

/** Fixed, so "next year" in the year rule does not move under the tests. */
const TODAY = new Date("2026-08-27T12:00:00.000Z");

function problem(overrides: Partial<BookValues>) {
  const result = parseBook(values(overrides), TODAY);
  if (result.ok) throw new Error("Expected the form to be turned down");
  return result.problem;
}

describe("parseBook", () => {
  it("turns a filled-in form into a catalogue entry", () => {
    const result = parseBook(values(), TODAY);

    expect(result).toEqual({
      ok: true,
      book: {
        title: "Sult",
        author: "Knut Hamsun",
        isbn: "978-82-05-38001-2",
        year: 1890,
        copies: 3,
      },
    });
  });

  it("trims what was typed, so a stray space is not part of the title", () => {
    const result = parseBook(values({ title: "  Sult  ", copies: " 3 " }), TODAY);

    expect(result.ok && result.book.title).toBe("Sult");
    expect(result.ok && result.book.copies).toBe(3);
  });

  it("keeps the ISBN as it was written, hyphens and all", () => {
    const result = parseBook(values({ isbn: "9788205380012" }), TODAY);

    expect(result.ok && result.book.isbn).toBe("9788205380012");
  });

  it("needs a title", () => {
    expect(problem({ title: "   " }).field).toBe("title");
  });

  it("needs an author", () => {
    expect(problem({ author: "" }).field).toBe("author");
  });

  it("reports the first problem in reading order, not the last", () => {
    expect(problem({ title: "", author: "", copies: "0" }).field).toBe("title");
  });

  it.each(["123", "97882053800123", "978820538001X", ""])(
    "turns down %o as an ISBN",
    (isbn) => {
      expect(problem({ isbn }).field).toBe("isbn");
    }
  );

  it("accepts an ISBN-10 ending in X", () => {
    expect(parseBook(values({ isbn: "82-05-38001-X" }), TODAY).ok).toBe(true);
  });

  it("accepts next year — books are printed ahead of their imprint year", () => {
    expect(parseBook(values({ year: "2027" }), TODAY).ok).toBe(true);
  });

  it.each(["2028", "1449", "nittenhundre", "1890,5", ""])(
    "turns down %o as a year",
    (year) => {
      expect(problem({ year }).field).toBe("year");
    }
  );

  it.each(["0", "-1", "2.5", "1000", ""])(
    "turns down %o as a copy count",
    (copies) => {
      expect(problem({ copies }).field).toBe("copies");
    }
  );

  it("accepts a single copy", () => {
    expect(parseBook(values({ copies: "1" }), TODAY).ok).toBe(true);
  });
});

describe("isbn", () => {
  it("strips the hyphens and spaces that only group the digits", () => {
    expect(normalizeIsbn("978-82-05 38001-2")).toBe("9788205380012");
  });

  it("upper-cases the check letter of an ISBN-10", () => {
    expect(normalizeIsbn("82-05-38001-x")).toBe("820538001X");
  });

  it("reads two spellings of one number as the same book", () => {
    expect(sameIsbn("978-82-05-38001-2", "9788205380012")).toBe(true);
  });

  it("does not confuse two different numbers", () => {
    expect(sameIsbn("9788205380012", "9788205380013")).toBe(false);
  });

  it.each(["9788205380012", "978-82-05-38001-2", "820538001X", "0747532699"])(
    "accepts %o",
    (isbn) => {
      expect(isValidIsbn(isbn)).toBe(true);
    }
  );

  it.each(["", "12345", "97882053800121", "X788205380012"])(
    "rejects %o",
    (isbn) => {
      expect(isValidIsbn(isbn)).toBe(false);
    }
  );
});
