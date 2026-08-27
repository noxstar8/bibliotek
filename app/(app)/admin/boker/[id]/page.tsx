import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

import { BookForm } from "@/components/book-form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DeleteBook } from "@/components/delete-book";
import { LibrarianRequired } from "@/components/librarian-required";
import { PageHeading } from "@/components/page-heading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateBookAction } from "@/lib/actions";
import { isLibrarian, requireBorrower } from "@/lib/auth";
import { describeError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { findBook, listActiveLoansForBook } from "@/lib/loans";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/admin/boker/[id]">): Promise<Metadata> {
  const book = await findBook((await params).id);
  if (!book) return { title: "Ukjent bok – Bibliotek" };

  return {
    title: `Rediger ${book.title} – Bibliotek`,
    description: `Rett opplysningene om ${book.title} i katalogen`,
  };
}

/** One figure with its label above it, the way the stat blocks read elsewhere. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

export default async function EditBookPage({
  params,
  searchParams,
}: PageProps<"/admin/boker/[id]">) {
  const user = await requireBorrower();
  if (!isLibrarian(user)) {
    return (
      <>
        <PageHeading title="Rediger bok" />
        <LibrarianRequired user={user} />
      </>
    );
  }

  const { id } = await params;
  const book = await findBook(id);
  if (!book) notFound();

  const [activeLoans, { lagret, feil }] = await Promise.all([
    listActiveLoansForBook(id),
    searchParams,
  ]);
  const error = describeError(feil);

  // The copy that comes back first — the answer to "when can I take this title
  // out of the catalogue?".
  const nextDueAt = activeLoans
    .map((loan) => loan.dueAt)
    .sort((a, b) => a.localeCompare(b))
    .at(0);

  return (
    <>
      <Breadcrumbs
        trail={[
          { label: "Administrasjon", href: "/admin" },
          { label: "Bøker", href: "/admin/boker" },
          { label: book.title },
        ]}
      />
      <PageHeading title={book.title}>
        {book.author} · {book.year}
      </PageHeading>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.description}</AlertDescription>
        </Alert>
      ) : null}

      {lagret ? (
        <Alert className="mb-6">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
          <AlertTitle>Endringene er lagret</AlertTitle>
          <AlertDescription>
            Katalogen er oppdatert, og boklisten viser opplysningene under med én
            gang.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Boken du redigerer</CardTitle>
          <CardDescription>
            Slik tittelen står i samlingen akkurat nå. Tallene følger av lånene
            og endres ikke i skjemaet under.
          </CardDescription>
          <CardAction>
            {book.available > 0 ? (
              <Badge>Tilgjengelig</Badge>
            ) : (
              <Badge variant="secondary">Utlånt</Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 text-sm sm:grid-cols-3">
            <Fact label="Eksemplarer">
              <span className="tabular-nums">
                {book.available} av {book.copies}
              </span>{" "}
              ledige
            </Fact>
            <Fact label="Ute på lån">
              {book.onLoan === 0 ? (
                <span className="text-muted-foreground">Ingen</span>
              ) : (
                <span className="tabular-nums">{book.onLoan}</span>
              )}
            </Fact>
            <Fact label="Første innlevering">
              {nextDueAt ? (
                <span className="tabular-nums">{formatDate(nextDueAt)}</span>
              ) : (
                <span className="text-muted-foreground">Ingen lån løper</span>
              )}
            </Fact>
          </dl>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/boker/${book.id}`} />}
          >
            Se boken slik lånerne ser den
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
        </CardFooter>
      </Card>

      <BookForm action={updateBookAction} book={book} />

      <Separator className="my-10" />

      <DeleteBook bookId={book.id} title={book.title} onLoan={book.onLoan} />
    </>
  );
}
