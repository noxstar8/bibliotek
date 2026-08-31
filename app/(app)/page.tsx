import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Book02Icon,
  Bookmark02Icon,
  BookOpen01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";

import { PageHeading } from "@/components/page-heading";
import { ColumnHead, IDENTITY_CELL, RecordCell } from "@/components/record-cell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
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
import { borrowBookAction, reserveBookAction } from "@/lib/actions";
import { getCurrentBorrower } from "@/lib/auth";
import { listBooks } from "@/lib/loans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bøker – Bibliotek",
  description: "Alle titlene i samlingen og hvor mange eksemplarer som er ledige",
};

export default async function BooksPage() {
  const [books, viewer] = await Promise.all([listBooks(), getCurrentBorrower()]);

  return (
    <>
      <PageHeading title="Bøker">
        Hele samlingen, med antall eksemplarer som står ledig akkurat nå. Åpne en
        tittel for å låne den.
      </PageHeading>

      {books.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Book02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Ingen bøker i katalogen</EmptyTitle>
            <EmptyDescription>
              Samlingen er tom. Legg inn titler i datagrunnlaget før du låner ut.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Samlingen</CardTitle>
            <CardDescription>
              {books.length} titler. Lånetiden er 28 dager fra utlånsdagen.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <ColumnHead className="pl-(--card-spacing)">Tittel</ColumnHead>
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
                        href={`/boker/${book.id}`}
                      >
                        {book.author} · {book.year}
                      </RecordCell>
                    </TableCell>
                    <TableCell className="py-3 text-right font-medium tabular-nums">
                      {book.available} av {book.copies}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col items-start gap-1.5 leading-snug">
                        {book.available > 0 ? (
                          <Badge>Tilgjengelig</Badge>
                        ) : (
                          <Badge variant="secondary">Utlånt</Badge>
                        )}
                        {book.reserved > 0 ? (
                          <span className="text-muted-foreground tabular-nums">
                            {book.reserved} i kø
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 pr-(--card-spacing) text-right">
                      {/* The forms live outside the popup. A menu closes the
                          instant an item is pressed, and a form torn out of the
                          tree mid-submit never completes — so the item points at
                          one of these with the native `form` attribute. */}
                      <form
                        id={`laan-${book.id}`}
                        action={borrowBookAction}
                        className="hidden"
                      >
                        <input type="hidden" name="bookId" value={book.id} />
                      </form>
                      <form
                        id={`reserver-${book.id}`}
                        action={reserveBookAction}
                        className="hidden"
                      >
                        <input type="hidden" name="bookId" value={book.id} />
                        <input type="hidden" name="title" value={book.title} />
                      </form>
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
                          {viewer && book.available > 0 ? (
                            <DropdownMenuItem
                              nativeButton
                              render={
                                <button type="submit" form={`laan-${book.id}`} />
                              }
                            >
                              <HugeiconsIcon
                                icon={BookOpen01Icon}
                                strokeWidth={2}
                              />
                              Lån boken
                            </DropdownMenuItem>
                          ) : viewer ? (
                            // Every copy is out, so the queue takes the place a
                            // dead, disabled «Lån boken» used to sit in. The list
                            // cannot know whether this reader is already in the
                            // queue; the refusal lands them on the book page,
                            // which shows their place in it.
                            <DropdownMenuItem
                              nativeButton
                              render={
                                <button
                                  type="submit"
                                  form={`reserver-${book.id}`}
                                />
                              }
                            >
                              <HugeiconsIcon icon={Bookmark02Icon} strokeWidth={2} />
                              Reserver
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem render={<Link href="/logg-inn" />}>
                              <HugeiconsIcon
                                icon={BookOpen01Icon}
                                strokeWidth={2}
                              />
                              Logg inn for å låne
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            render={<Link href={`/boker/${book.id}`} />}
                          >
                            <HugeiconsIcon
                              icon={ArrowRight01Icon}
                              strokeWidth={2}
                            />
                            Åpne boken
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
