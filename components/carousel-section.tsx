import type { ComponentProps } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { BookCarousel } from "@/components/book-carousel";
import { buttonVariants } from "@/components/ui/button";
import type { BookView } from "@/lib/loans";

/**
 * A titled row of books: a heading and one plain sentence saying what the row
 * holds, an optional link on to the full list, and the carousel itself below.
 *
 * The section owns the framing and `BookCarousel` owns the scrolling, so a
 * page states what a row is *about* without repeating the header markup each
 * time it wants another row.
 *
 * A server component — nothing here is interactive, and keeping it on the
 * server means only the carousel itself ships to the browser.
 *
 * The heading sits in the content column while the carousel runs its full
 * width, so the link is placed on the same row as the title rather than after
 * the track, where it would drift away from what it belongs to.
 */
export function CarouselSection({
	title,
	description,
	href,
	linkLabel = "Vis alle",
	books,
	status,
}: {
	title: string;
	/** One sentence saying what this row collects. */
	description: string;
	/** Where the whole list lives. Without it the section shows no link. */
	href?: string;
	linkLabel?: string;
	books: BookView[];
	/** Passed through to the carousel — see {@link BookCarousel}. */
	status?: ComponentProps<typeof BookCarousel>["status"];
}) {
	if (books.length === 0) return null;

	return (
		<section className="flex flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h2 className="font-heading text-xl font-medium tracking-tight">
						{title}
					</h2>
					<p className="max-w-2xl text-sm/relaxed text-muted-foreground">
						{description}
					</p>
				</div>

				{href ? (
					<Link
						href={href}
						className={buttonVariants({ variant: "outline", size: "sm" })}
					>
						{linkLabel}
						<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
					</Link>
				) : null}
			</div>

			<BookCarousel books={books} status={status} />
		</section>
	);
}
