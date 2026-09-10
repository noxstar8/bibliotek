"use client";

import Link from "next/link";

import { BookCover } from "@/components/book-cover";
import { Badge } from "@/components/ui/badge";
import {
	Carousel,
	CarouselContent,
	CarouselDots,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import type { BookView } from "@/lib/loans";

/**
 * A row of titles the reader can scroll through. Unlike `BookTable`, this is a
 * browsing surface rather than a record list: it shows a handful of books to
 * pick from, so it carries the title and its availability and nothing else.
 *
 * Each card is a cover over a block of information. Four fit across a desktop
 * window, dropping to three, two and one as the window narrows.
 *
 * The two narrow steps are deliberately *not* whole fractions: at `basis-4/5`
 * and `basis-[45%]` the next card is cut off by the edge rather than meeting
 * it, which is what tells a reader the row continues. Where the arrows are
 * hidden that sliver is the only cue that this scrolls at all, so it earns the
 * space it costs. From `md` up there are enough cards on screen for the row to
 * read as a row, and the widths go back to even fractions.
 *
 * The track runs the full width of the content column, so the first and last
 * card line up with the wordmark in the header rather than sitting inset from
 * it. That leaves no room inside the column for the arrows, so they are pushed
 * out into the page gutter: `-left-11` / `-right-11` clears the column's own
 * `px-6` and centres the button in the margin beside it.
 *
 * Below `lg` the gutter is the whole margin there is, so the arrows would hang
 * off the screen — they are hidden there and the track is swiped instead.
 */
export function BookCarousel({
	books,
	status = "availability",
}: {
	books: BookView[];
	/**
	 * What the badge on each card reports.
	 *
	 * `"availability"` is the everyday answer — can I take this home. `"queue"`
	 * is for a row where every title is already out: there the availability
	 * badge would read "Utlånt" on every card and say nothing, so the queue
	 * length takes its place, which is the number that actually separates them.
	 */
	status?: "availability" | "queue";
}) {
	if (books.length === 0) return null;

	return (
		<Carousel opts={{ align: "start" }} className="w-full">
			<CarouselContent>
				{books.map((book) => (
					<CarouselItem
						key={book.id}
						className="basis-4/5 sm:basis-[45%] md:basis-1/3 lg:basis-1/4"
					>
						{/* `overflow-hidden` so the square cover takes the card's top
						corners; the ring stays on the outside of it. The whole card is
						the hover group, so pointing anywhere on it underlines the title
						— the surface itself stays still. */}
						<Link
							href={`/boker/${book.id}`}
							className="group/book flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						>
							<BookCover
								isbn={book.isbn}
								title={book.title}
								size="L"
								className="aspect-square w-full"
								sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
							/>

							<span className="flex flex-1 flex-col gap-4 p-5">
								<span className="flex flex-col gap-1">
									<span className="font-heading text-base font-medium tracking-tight decoration-foreground/25 underline-offset-4 group-hover/book:underline">
										{book.title}
									</span>
									<span className="text-sm/relaxed text-muted-foreground">
										{book.author} · {book.year}
									</span>
								</span>

								<span className="mt-auto flex items-center gap-2">
									{status === "queue" ? (
										<>
											<Badge variant="secondary">
												{book.reserved} i kø
											</Badge>
											<span className="text-sm text-muted-foreground tabular-nums">
												{book.onLoan === 1
													? "1 eksemplar ute"
													: `${book.onLoan} eksemplarer ute`}
											</span>
										</>
									) : (
										<>
											{book.available > 0 ? (
												<Badge>Tilgjengelig</Badge>
											) : (
												<Badge variant="secondary">Utlånt</Badge>
											)}
											<span className="text-sm text-muted-foreground tabular-nums">
												{book.available} av {book.copies}
											</span>
										</>
									)}
								</span>
							</span>
						</Link>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious className="-left-11 hidden lg:inline-flex" />
			<CarouselNext className="-right-11 hidden lg:inline-flex" />
			{/* Below `lg` the arrows are gone, so these are the only visible
			control besides swiping. */}
			<CarouselDots className="mt-6" />
		</Carousel>
	);
}
