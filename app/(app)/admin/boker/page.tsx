import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowRight01Icon,
  Book02Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";

import { AdminNav } from "@/components/admin-nav";
import { LibrarianRequired } from "@/components/librarian-required";
import { PageHeading } from "@/components/page-heading";
import { ColumnHead, IDENTITY_CELL, RecordCell } from "@/components/record-cell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isLibrarian, requireBorrower } from "@/lib/auth";
import { describeError } from "@/lib/errors";
import { listBooks } from "@/lib/loans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bøker – Bibliotek",
  description: "Hele katalogen, med mulighet for å legge til, rette og slette titler",
};

export default async function AdminBooksPage({
  searchParams,
}: PageProps<"/admin/boker">) {
  const user = await requireBorrower();
  if (!isLibrarian(user)) {
    return (
      <>
        <PageHeading title="Bøker" />
        <LibrarianRequired user={user} />
      </>
    );
  }

  const [books, { ny, slettet, feil }] = await Promise.all([
    listBooks(),
    searchParams,
  ]);
  const added = typeof ny === "string" ? books.find((book) => book.id === ny) : null;
  const removed = typeof slettet === "string" ? slettet : null;
  const error = describeError(feil);

  return (
    <>
      <PageHeading title="Bøker">
        Hele katalogen, slik den ligger i systemet. Herfra legger du inn nye
        titler, retter opplysninger som er feil, og tar titler ut av samlingen.
      </PageHeading>
      <AdminNav />

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.description}</AlertDescription>
        </Alert>
      ) : null}

      {added ? (
        <Alert className="mb-6">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
          <AlertTitle>«{added.title}» er lagt i katalogen</AlertTitle>
          <AlertDescription>
            Tittelen står i boklisten og kan lånes ut med én gang.
          </AlertDescription>
        </Alert>
      ) : null}

      {removed ? (
        <Alert className="mb-6">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
          <AlertTitle>«{removed}» er slettet</AlertTitle>
          <AlertDescription>
            Tittelen er ute av katalogen og kan ikke lånes ut. Tidligere lån på
            den står fortsatt i historikken.
          </AlertDescription>
        </Alert>
      ) : null}

      {books.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Book02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Ingen bøker i katalogen</EmptyTitle>
            <EmptyDescription>
              Samlingen er tom. Legg inn den første tittelen, så kan den lånes ut
              med det samme.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/admin/boker/ny" />}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
              Ny bok
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Katalogen</CardTitle>
            <CardDescription>
              {books.length} titler, sortert slik de ble lagt inn.
            </CardDescription>
            <CardAction>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/admin/boker/ny" />}
              >
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
                Ny bok
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <ColumnHead className="pl-(--card-spacing)">Tittel</ColumnHead>
                  <ColumnHead>ISBN</ColumnHead>
                  <ColumnHead className="text-right">Eksemplarer</ColumnHead>
                  <ColumnHead>Status</ColumnHead>
                  <ColumnHead className="pr-(--card-spacing) text-right">
                    Handling
                  </ColumnHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell
                      className={`py-3 pl-(--card-spacing) ${IDENTITY_CELL}`}
                    >
                      <RecordCell
                        icon={book.available > 0 ? Book02Icon : BookOpen01Icon}
                        name={book.title}
                        href={`/admin/boker/${book.id}`}
                      >
                        {book.author} · {book.year}
                      </RecordCell>
                    </TableCell>
                    <TableCell className="py-3 tabular-nums text-muted-foreground">
                      {book.isbn}
                    </TableCell>
                    <TableCell className="py-3 text-right font-medium tabular-nums">
                      {book.available} av {book.copies}
                    </TableCell>
                    <TableCell className="py-3">
                      {book.available > 0 ? (
                        <Badge>Tilgjengelig</Badge>
                      ) : (
                        <Badge variant="secondary">Utlånt</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 pr-(--card-spacing) text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={buttonVariants({
                            variant: "ghost",
                            size: "icon-sm",
                          })}
                          aria-label={`Handlinger for «${book.title}»`}
                        >
                          <HugeiconsIcon
                            icon={MoreVerticalIcon}
                            strokeWidth={2}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            render={<Link href={`/admin/boker/${book.id}`} />}
                          >
                            <HugeiconsIcon
                              icon={PencilEdit02Icon}
                              strokeWidth={2}
                            />
                            Rediger boken
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            render={<Link href={`/boker/${book.id}`} />}
                          >
                            <HugeiconsIcon
                              icon={ArrowRight01Icon}
                              strokeWidth={2}
                            />
                            Se bok
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
