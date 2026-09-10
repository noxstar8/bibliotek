import Link from "next/link";
import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowRight01Icon,
	Book02Icon,
	Bookmark02Icon,
	BookOpen01Icon,
	MoreVerticalIcon,
} from "@hugeicons/core-free-icons";

import { BookCover } from "@/components/book-cover";
import {
	ColumnHead,
	IDENTITY_CELL,
	RecordCell,
} from "@/components/record-cell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { borrowBookAction, reserveBookAction } from "@/lib/actions";
import type { BookView } from "@/lib/loans";
import type { Borrower } from "@/lib/types";

/**
 * The catalogue as a table: one row per title, with what a reader can do about
 * it. The book list and the search results are the same table over different
 * rows, so they share this one — a title must not read differently depending
 * on which page found it.
 */
export function BookTable({
	books,
	viewer,
	title,
	description,
	action,
}: {
	books: BookView[];
	/** Who is looking, which decides whether a row offers a loan or a log in. */
	viewer: Borrower | null;
	title: string;
	description: ReactNode;
	action?: ReactNode;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
				{action ? <CardAction>{action}</CardAction> : null}
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
										media={
											<BookCover
												isbn={book.isbn}
												title={book.title}
												className="size-9 shrink-0 rounded-xl"
												fallbackIcon={
													book.available > 0 ? Book02Icon : BookOpen01Icon
												}
												sizes="36px"
											/>
										}
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
									{/* Outside the popup: a menu closes on press, and a
									form torn out mid-submit never completes. */}
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
											<HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
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
												// Every copy is out, so the queue replaces a dead
												// «Lån boken». A refusal lands on the book page.
												<DropdownMenuItem
													nativeButton
													render={
														<button
															type="submit"
															form={`reserver-${book.id}`}
														/>
													}
												>
													<HugeiconsIcon
														icon={Bookmark02Icon}
														strokeWidth={2}
													/>
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
	);
}
