/**
 * An ISBN is written with hyphens about as often as without, and the hyphens
 * carry no meaning of their own — they only group the parts of the number.
 * Anything that compares two ISBNs has to compare the digits, or the same book
 * gets into the catalogue twice under two spellings of one number.
 */

/** Digits only, with the check letter of an ISBN-10 upper-cased. */
export function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, "").toUpperCase();
}

/**
 * Whether the number has the shape of an ISBN-10 (nine digits and a check digit
 * that may be `X`) or an ISBN-13.
 *
 * The check digit itself is not verified. A librarian copying a number off a
 * cover is far more likely to be right than the arithmetic is to be worth a
 * refused entry, and a wrong digit is fixable later.
 */
export function isValidIsbn(isbn: string): boolean {
  return /^(?:\d{9}[\dX]|\d{13})$/.test(normalizeIsbn(isbn));
}

export function sameIsbn(one: string, other: string): boolean {
  return normalizeIsbn(one) === normalizeIsbn(other);
}
