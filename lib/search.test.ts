import { describe, expect, it } from "vitest";

import { normalizeQuery, searchBooks, toSuggestion } from "@/lib/search";
import type { Book } from "@/lib/types";

function book(overrides: Partial<Book> = {}): Book {
	return {
		id: "bok-sult",
		title: "Sult",
		author: "Knut Hamsun",
		isbn: "978-82-05-38001-2",
		year: 1890,
		copies: 3,
		...overrides,
	};
}

/** A shelf with one title per way of matching, so the ordering is readable. */
const SHELF: Book[] = [
	book({ id: "bok-markens-grode", title: "Markens grøde", year: 1917 }),
	book({
		id: "bok-kristin",
		title: "Kristin Lavransdatter",
		author: "Sigrid Undset",
		isbn: "978-82-03-19351-2",
		year: 1920,
	}),
	book({ id: "bok-sult" }),
];

function titles(query: string): string[] {
	return searchBooks(SHELF, query).map((hit) => hit.title);
}

describe("normalizeQuery", () => {
	it("trims, folds case and collapses runs of spaces", () => {
		expect(normalizeQuery("  Knut   HAMSUN ")).toBe("knut hamsun");
	});
});

describe("searchBooks", () => {
	it("finds nothing on a single character", () => {
		expect(titles("s")).toEqual([]);
	});

	it("finds nothing on an empty query", () => {
		expect(titles("   ")).toEqual([]);
	});

	it("matches part of a title, whatever the case", () => {
		expect(titles("KRIST")).toEqual(["Kristin Lavransdatter"]);
	});

	it("matches the author", () => {
		expect(titles("hamsun")).toEqual(["Markens grøde", "Sult"]);
	});

	it("matches an ISBN written without hyphens", () => {
		expect(titles("9788203193512")).toEqual(["Kristin Lavransdatter"]);
	});

	it("puts a title starting with the term ahead of one only containing it", () => {
		const shelf = [
			book({ id: "bok-en", title: "Om sulten" }),
			book({ id: "bok-to", title: "Sult" }),
		];

		expect(searchBooks(shelf, "sult").map((hit) => hit.id)).toEqual([
			"bok-to",
			"bok-en",
		]);
	});

	it("puts a title match ahead of an author match", () => {
		const shelf = [
			book({ id: "bok-en", title: "Ved veien", author: "Undset" }),
			book({ id: "bok-to", title: "Undset i utvalg", author: "Hamsun" }),
		];

		expect(searchBooks(shelf, "undset").map((hit) => hit.id)).toEqual([
			"bok-to",
			"bok-en",
		]);
	});

	it("keeps titles sharing a rank in catalogue order", () => {
		expect(titles("hamsun")).toEqual(["Markens grøde", "Sult"]);
	});

	it("keeps whatever the caller passed in", () => {
		const shelf = [{ ...book(), available: 2 }];

		expect(searchBooks(shelf, "sult")[0].available).toBe(2);
	});
});

describe("toSuggestion", () => {
	it("keeps only the fields a suggestion row shows", () => {
		expect(toSuggestion(book())).toEqual({
			id: "bok-sult",
			title: "Sult",
			author: "Knut Hamsun",
			year: 1890,
		});
	});
});
