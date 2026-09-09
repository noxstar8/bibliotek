import { normalizeIsbn } from "@/lib/isbn";
import type { Book } from "@/lib/types";

/**
 * Free-text search over the catalogue. A pure rule, like the others here: it is
 * handed the titles and gives back the ones that match, so the same ordering
 * serves the dropdown in the header, the API route behind it, and the results
 * page — three places that must never disagree about what «hamsun» finds.
 */

/** The dropdown opens from the second character; one letter matches half the shelf. */
export const MIN_QUERY_LENGTH = 2;

/** How many hits the dropdown shows before it offers the full list instead. */
export const SUGGESTION_LIMIT = 7;

/** What a suggestion row in the dropdown needs, and nothing more. */
export type Suggestion = {
	id: string;
	title: string;
	author: string;
	year: number;
};

/** Trimmed and folded to lower case, the shape the matching works in. */
export function normalizeQuery(query: string): string {
	return query.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * How well a title answers the term, lower being better. `null` is no match.
 *
 * The order is what someone typing expects to see: a title that *starts* with
 * what was typed before one that merely contains it, the title before the
 * author, and the ISBN last — nobody types seven digits hoping for a guess.
 */
function rank(book: Book, term: string): number | null {
	const title = book.title.toLowerCase();
	if (title.startsWith(term)) return 0;

	const author = book.author.toLowerCase();
	if (author.startsWith(term)) return 1;

	if (title.includes(term)) return 2;
	if (author.includes(term)) return 3;

	// Hyphens are written as often as they are left out, so both sides are
	// reduced to digits before they are compared.
	if (normalizeIsbn(book.isbn).includes(normalizeIsbn(term))) return 4;

	return null;
}

/**
 * The titles matching `query`, best first. A query shorter than
 * {@link MIN_QUERY_LENGTH} finds nothing rather than everything.
 *
 * Generic in the book, so the caller keeps whatever it passed in — the results
 * page hands in `BookView`s and gets the availability back out with them.
 */
export function searchBooks<T extends Book>(books: T[], query: string): T[] {
	const term = normalizeQuery(query);
	if (term.length < MIN_QUERY_LENGTH) return [];

	return (
		books
			.map((book) => ({ book, rank: rank(book, term) }))
			.filter((hit): hit is { book: T; rank: number } => hit.rank !== null)
			// A stable sort, so titles sharing a rank stay in catalogue order.
			.sort((one, other) => one.rank - other.rank)
			.map((hit) => hit.book)
	);
}

/** Strips a match down to the fields a suggestion row shows. */
export function toSuggestion(book: Book): Suggestion {
	return {
		id: book.id,
		title: book.title,
		author: book.author,
		year: book.year,
	};
}
