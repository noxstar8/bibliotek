"use client";

import Link from "next/link";
import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  FloppyDiskIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { BookField, BookState } from "@/lib/forms";
import { emptyBookState } from "@/lib/forms";
import type { Book } from "@/lib/types";

/** Where "Avbryt" leaves you, whichever half of the form you were in. */
const CATALOGUE = "/admin/boker";

/**
 * The catalogue form, used both to add a title and to correct one. Pass `book`
 * to edit it; leave it out and the same fields open blank for a new entry.
 *
 * On rejection the action hands back which field was wrong together with what
 * was typed, so a correction is never thrown away — the same bargain the
 * enrolment form makes.
 */
export function BookForm({
  action,
  book,
}: {
  action: (state: BookState, formData: FormData) => Promise<BookState>;
  book?: Book;
}) {
  const [state, formAction, pending] = useActionState(action, emptyBookState);
  const editing = book !== undefined;
  const invalid = state.error?.field;

  /**
   * What was typed on a refused attempt wins over what the catalogue holds. The
   * two only differ after a rejection, and that is exactly when overwriting the
   * librarian's own words would be wrong.
   */
  const value = (field: BookField) =>
    state.values?.[field] ?? (book ? String(book[field]) : "");

  return (
    <form action={formAction}>
      {book ? <input type="hidden" name="bookId" value={book.id} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Rediger boken" : "Ny bok"}</CardTitle>
          <CardDescription>
            {editing
              ? "Oppdater opplysningene om tittelen i katalogen. Endringene slår ut i boklisten med én gang."
              : "Legg en tittel inn i katalogen. Den kan lånes ut så snart den er lagret."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {invalid === "form" ? (
              <Alert variant="destructive">
                <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
                <AlertTitle>Ingen ting ble lagret</AlertTitle>
                <AlertDescription>{state.error?.message}</AlertDescription>
              </Alert>
            ) : null}

            <Field data-invalid={invalid === "title" ? "true" : undefined}>
              <FieldLabel htmlFor="book-title">Tittel</FieldLabel>
              <Input
                id="book-title"
                name="title"
                defaultValue={value("title")}
                placeholder="Tittelen slik den står på boken"
                aria-invalid={invalid === "title" || undefined}
                autoComplete="off"
              />
              {invalid === "title" ? (
                <FieldError>{state.error?.message}</FieldError>
              ) : null}
            </Field>

            <div className="grid gap-7 sm:grid-cols-2">
              <Field data-invalid={invalid === "author" ? "true" : undefined}>
                <FieldLabel htmlFor="book-author">Forfatter</FieldLabel>
                <Input
                  id="book-author"
                  name="author"
                  defaultValue={value("author")}
                  placeholder="Fornavn Etternavn"
                  aria-invalid={invalid === "author" || undefined}
                  autoComplete="off"
                />
                {invalid === "author" ? (
                  <FieldError>{state.error?.message}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={invalid === "year" ? "true" : undefined}>
                <FieldLabel htmlFor="book-year">Utgivelsesår</FieldLabel>
                <Input
                  id="book-year"
                  name="year"
                  type="number"
                  step={1}
                  defaultValue={value("year")}
                  placeholder="1997"
                  className="tabular-nums"
                  aria-invalid={invalid === "year" || undefined}
                  autoComplete="off"
                />
                {invalid === "year" ? (
                  <FieldError>{state.error?.message}</FieldError>
                ) : (
                  <FieldDescription>
                    Året utgaven biblioteket eier ble gitt ut.
                  </FieldDescription>
                )}
              </Field>
            </div>

            <div className="grid gap-7 sm:grid-cols-2">
              <Field data-invalid={invalid === "isbn" ? "true" : undefined}>
                <FieldLabel htmlFor="book-isbn">ISBN</FieldLabel>
                <Input
                  id="book-isbn"
                  name="isbn"
                  defaultValue={value("isbn")}
                  placeholder="978-0-7475-3269-9"
                  className="tabular-nums"
                  aria-invalid={invalid === "isbn" || undefined}
                  autoComplete="off"
                />
                {invalid === "isbn" ? (
                  <FieldError>{state.error?.message}</FieldError>
                ) : (
                  <FieldDescription>
                    Skiller titlene fra hverandre. Må være unik i katalogen.
                  </FieldDescription>
                )}
              </Field>

              <Field data-invalid={invalid === "copies" ? "true" : undefined}>
                <FieldLabel htmlFor="book-copies">Eksemplarer</FieldLabel>
                <Input
                  id="book-copies"
                  name="copies"
                  type="number"
                  step={1}
                  min={1}
                  defaultValue={value("copies") || "1"}
                  className="tabular-nums"
                  aria-invalid={invalid === "copies" || undefined}
                  autoComplete="off"
                />
                {invalid === "copies" ? (
                  <FieldError>{state.error?.message}</FieldError>
                ) : (
                  <FieldDescription>
                    Hvor mange fysiske eksemplarer biblioteket eier.
                  </FieldDescription>
                )}
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
        <CardFooter className="gap-3">
          <Button type="submit" disabled={pending}>
            <HugeiconsIcon
              icon={editing ? FloppyDiskIcon : PlusSignIcon}
              strokeWidth={2}
            />
            {pending
              ? editing
                ? "Lagrer …"
                : "Legger til …"
              : editing
                ? "Lagre"
                : "Legg til bok"}
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={CATALOGUE} />}
          >
            Avbryt
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
