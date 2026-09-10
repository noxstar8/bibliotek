import { normalizeIsbn } from "@/lib/isbn";

/**
 * Cover images come from Open Library's Covers API, which is addressed by ISBN
 * alone:
 *
 *     https://covers.openlibrary.org/b/isbn/9780747532699-L.jpg
 *
 * There is no lookup call and no key — the URL *is* the request. That is why
 * this module is a rule and not a service: it computes a string from a field we
 * already hold, so nothing here touches the network or the disk, and the
 * catalogue keeps working unchanged the day the images are unreachable.
 *
 * Documentation: https://openlibrary.org/dev/docs/api/covers
 */

/**
 * `S` is too small to read a title off, so the app only uses the two larger
 * sizes: `M` for the tile beside a row, `L` for a cover the page is built
 * around.
 */
export type CoverSize = "M" | "L";

/**
 * The address of the cover for an ISBN, or `null` when the number is not one we
 * can ask about.
 *
 * `default=false` is the important part. Without it the service answers a
 * missing cover with a 1×1 transparent pixel and a 200, which loads
 * successfully and leaves a blank hole no `onError` can catch. With it the
 * answer is a 404, so a caller can tell "no cover" apart from "cover" and show
 * something in its place.
 */
export function coverUrl(isbn: string, size: CoverSize = "M"): string | null {
  const digits = normalizeIsbn(isbn);

  // The endpoint takes ISBN-10 and ISBN-13 alike, but only digits — the
  // hyphens the catalogue stores would make it a different, missing key.
  if (!/^(?:\d{9}[\dX]|\d{13})$/.test(digits)) return null;

  return `https://covers.openlibrary.org/b/isbn/${digits}-${size}.jpg?default=false`;
}
