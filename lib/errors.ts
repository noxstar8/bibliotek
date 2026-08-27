import type { BookError } from "@/lib/books";
import type { LoanError } from "@/lib/loans";

/**
 * A failed borrow or return sends the reader back to the page they came from
 * with a `?feil=` marker, so the message survives the redirect without turning
 * the page into a client component.
 */

/**
 * Both failure vocabularies share `"book-not-found"`, and they mean the same
 * thing to a reader either way: the title is not there any more.
 */
export type AppError = LoanError | BookError;

const slugs: Record<AppError, string> = {
  "book-not-found": "ukjent-bok",
  "no-copies-available": "ingen-eksemplarer",
  "loan-not-found": "ukjent-laan",
  "already-returned": "allerede-levert",
  "isbn-taken": "isbn-i-bruk",
  "copies-below-on-loan": "for-faa-eksemplarer",
  "book-on-loan": "boken-er-utlaant",
};

const messages: Record<string, { title: string; description: string }> = {
  "ukjent-bok": {
    title: "Fant ikke boken",
    description:
      "Tittelen finnes ikke lenger i katalogen. Ingen ting ble endret. Gå tilbake til boklisten og prøv på nytt.",
  },
  "ingen-eksemplarer": {
    title: "Ingen eksemplarer å låne ut",
    description:
      "Det siste eksemplaret ble lånt ut i mellomtiden. Lånet ble ikke registrert. Prøv igjen når et eksemplar er levert tilbake.",
  },
  "ukjent-laan": {
    title: "Fant ikke lånet",
    description:
      "Lånet finnes ikke i registeret. Returen ble ikke registrert. Oppdater siden og kontroller listen over aktive lån.",
  },
  "ukjent-laaner": {
    title: "Fant ikke låneren",
    description:
      "Personen står ikke i registeret lenger. Du er ikke logget inn. Velg en annen i listen under.",
  },
  "isbn-i-bruk": {
    title: "ISBN-et er i bruk",
    description:
      "En annen bok i katalogen har samme ISBN. Ingen ting ble lagret. Kontroller nummeret og prøv på nytt.",
  },
  "for-faa-eksemplarer": {
    title: "For få eksemplarer",
    description:
      "Flere eksemplarer er ute på lån enn antallet du oppga. Ingen ting ble lagret. Registrer retur først, eller oppgi et høyere antall.",
  },
  "boken-er-utlaant": {
    title: "Boken kan ikke slettes",
    description:
      "Ett eller flere eksemplarer er ute på lån. Boken står fortsatt i katalogen. Registrer retur på alle eksemplarene før du sletter den.",
  },
  "allerede-levert": {
    title: "Lånet er allerede levert",
    description:
      "Boken ble registrert som levert av noen andre. Ingen ting er endret, og eksemplaret står i hyllen.",
  },
};

export function errorSlug(error: AppError): string {
  return slugs[error];
}

export function describeError(slug: string | string[] | undefined) {
  if (typeof slug !== "string") return null;
  return messages[slug] ?? null;
}
