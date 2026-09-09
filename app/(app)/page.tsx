import type { Metadata } from "next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Book02Icon } from "@hugeicons/core-free-icons";

import { BookTable } from "@/components/book-table";
import { PageHeading } from "@/components/page-heading";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { getCurrentBorrower } from "@/lib/auth";
import { listBooks } from "@/lib/loans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Bøker – Bibliotek",
	description:
		"Alle titlene i samlingen og hvor mange eksemplarer som er ledige",
};

export default async function BooksPage() {
	const [books, viewer] = await Promise.all([
		listBooks(),
		getCurrentBorrower(),
	]);

	return (
		<>
			<PageHeading title="Bøker">
				Hele samlingen, med antall eksemplarer som står ledig akkurat nå. Åpne
				en tittel for å låne den.
			</PageHeading>

			{books.length === 0 ? (
				<Empty className="border bg-card">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={Book02Icon} strokeWidth={2} />
						</EmptyMedia>
						<EmptyTitle>Ingen bøker i katalogen</EmptyTitle>
						<EmptyDescription>
							Samlingen er tom. Legg inn titler i datagrunnlaget før du låner
							ut.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<BookTable
					books={books}
					viewer={viewer}
					title="Samlingen"
					description={`${books.length} titler. Lånetiden er 28 dager fra utlånsdagen.`}
				/>
			)}
		</>
	);
}
