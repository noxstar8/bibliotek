import { Fragment } from "react";
import type { Metadata } from "next";

import { CarouselSection } from "@/components/carousel-section";
import { Separator } from "@/components/ui/separator";
import { listBookRows, type BookView } from "@/lib/loans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Bibliotek",
	description: "Utlånssystem for småbiblioteket",
};

/**
 * How many titles a row shows. A carousel fits four across a desktop window,
 * so six leaves something to scroll to without turning the row into the whole
 * catalogue — that is what `/boker` is for.
 */
const PER_RAD = 6;

/** Most copies on the shelf first: the row answers "what can I take home now". */
function readyToBorrow(books: BookView[]): BookView[] {
	return books
		.filter((book) => book.available > 0)
		.sort((a, b) => b.available - a.available);
}

/**
 * Every copy out, but somebody is already waiting. Sorted by the queue, so the
 * titles where the wait says the most about the book come first.
 */
function worthTheWait(books: BookView[]): BookView[] {
	return books
		.filter((book) => book.available === 0 && book.reserved > 0)
		.sort((a, b) => b.reserved - a.reserved);
}

export default async function HomePage() {
	const { books, popular } = await listBookRows();

	// Built as a list rather than written out as markup, so the separators can
	// be placed between the rows that actually have books. A `<Separator />`
	// sitting in the markup beside a section that renders nothing leaves a bare
	// rule across the page — on an empty catalogue, two of them.
	const rows = [
		{
			key: "tilgjengelig",
			title: "Klar til å låne nå",
			description:
				"Titler med eksemplarer i hylla. Åpne en av dem for å låne den med det samme.",
			books: readyToBorrow(books).slice(0, PER_RAD),
		},
		{
			key: "populaert",
			title: "Populært akkurat nå",
			description:
				"Titlene som er lånt ut flest ganger, gjennom hele utlånshistorikken.",
			books: popular.slice(0, PER_RAD),
		},
		{
			key: "vent",
			title: "Verdt å vente på",
			description:
				"Alle eksemplarene er ute, men noen står allerede i kø. Reserver, så settes et eksemplar av til deg når det kommer inn.",
			status: "queue" as const,
			books: worthTheWait(books).slice(0, PER_RAD),
		},
	].filter((row) => row.books.length > 0);

	return (
		<div className="flex flex-col gap-10 py-10">
			{rows.map((row, index) => (
				<Fragment key={row.key}>
					{index > 0 ? <Separator /> : null}
					<CarouselSection
						title={row.title}
						description={row.description}
						href="/boker"
						status={row.status}
						books={row.books}
					/>
				</Fragment>
			))}
		</div>
	);
}
