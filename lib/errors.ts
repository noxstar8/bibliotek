import type { BookError } from "@/lib/books";
import type { BorrowerError } from "@/lib/borrowers";
import type { LoanError } from "@/lib/loans";
import type { ReservationError } from "@/lib/reservations";

/**
 * A failed borrow or return sends the reader back to the page they came from
 * with a `?feil=` marker, so the message survives the redirect without turning
 * the page into a client component.
 */

/**
 * Both failure vocabularies share `"book-not-found"`, and they mean the same
 * thing to a reader either way: the title is not there any more.
 */
export type AppError = LoanError | BookError | ReservationError | BorrowerError;

const slugs: Record<AppError, string> = {
  "book-not-found": "ukjent-bok",
  "no-copies-available": "ingen-eksemplarer",
  "loan-not-found": "ukjent-laan",
  "already-returned": "allerede-levert",
  "isbn-taken": "isbn-i-bruk",
  "copies-below-on-loan": "for-faa-eksemplarer",
  "book-on-loan": "boken-er-utlaant",
  "copies-available": "eksemplar-i-hyllen",
  "already-reserved": "allerede-reservert",
  "already-borrowed": "du-har-boken",
  "reservation-not-found": "ukjent-reservasjon",
  "reservation-closed": "reservasjon-avsluttet",
  "reservation-not-ready": "ikke-klar-til-henting",
  "not-your-reservation": "ikke-din-reservasjon",
  "borrower-not-found": "ukjent-bruker",
  "cannot-demote-self": "kan-ikke-degradere-seg-selv",
  "last-librarian": "siste-bibliotekar",
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
      "Flere eksemplarer er ute på lån eller satt av til henting enn antallet du oppga. Ingen ting ble lagret. Registrer retur eller utlevering først, eller oppgi et høyere antall.",
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
  "eksemplar-i-hyllen": {
    title: "Boken kan lånes nå",
    description:
      "Et eksemplar ble levert inn i mellomtiden, så det er ingen kø å stille seg i. Ingen reservasjon ble registrert — lån boken direkte i stedet.",
  },
  "allerede-reservert": {
    title: "Du står allerede i køen",
    description:
      "Du har en reservasjon på denne tittelen fra før. Ingen ny ble registrert, og du beholder plassen du har.",
  },
  "du-har-boken": {
    title: "Du har boken ute",
    description:
      "Tittelen står på lånekortet ditt allerede. Ingen reservasjon ble registrert. Lever eksemplaret før du stiller deg i kø for et nytt.",
  },
  "ukjent-reservasjon": {
    title: "Fant ikke reservasjonen",
    description:
      "Reservasjonen står ikke i køen lenger. Ingen ting ble endret — den kan ha blitt hentet eller slettet i mellomtiden.",
  },
  "reservasjon-avsluttet": {
    title: "Reservasjonen er avsluttet",
    description:
      "Reservasjonen er allerede hentet eller avbestilt. Ingen ting ble endret. Oppdater siden for å se køen slik den står nå.",
  },
  "ikke-klar-til-henting": {
    title: "Ingen eksemplarer å hente ut",
    description:
      "Det står ikke noe eksemplar av denne tittelen igjen til reservasjonen. Utlånet ble ikke registrert. Vent til et eksemplar er levert inn.",
  },
  "ikke-din-reservasjon": {
    title: "Reservasjonen tilhører en annen",
    description:
      "Du kan bare si fra deg dine egne reservasjoner. Ingen ting ble endret.",
  },

  "ukjent-bruker": {
    title: "Fant ikke brukeren",
    description:
      "Personen står ikke i registeret lenger. Ingen ting ble endret. Gå tilbake til brukerlisten og prøv på nytt.",
  },
  "kan-ikke-degradere-seg-selv": {
    title: "Du kan ikke ta fra deg selv tilgangen",
    description:
      "Da hadde du mistet administrasjonen i samme øyeblikk, også denne siden. Rollen står uendret. Be en annen bibliotekar om å gjøre det for deg.",
  },
  "siste-bibliotekar": {
    title: "Siste bibliotekar",
    description:
      "Personen er den eneste bibliotekaren i registeret, og da hadde ingen hatt tilgang til administrasjonen. Rollen står uendret. Gjør noen andre til bibliotekar først.",
  },
};

export function errorSlug(error: AppError): string {
  return slugs[error];
}

export function describeError(slug: string | string[] | undefined) {
  if (typeof slug !== "string") return null;
  return messages[slug] ?? null;
}
