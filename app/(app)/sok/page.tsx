import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

import { BookTable } from "@/components/book-table";
import { PageHeading } from "@/components/page-heading";
import { buttonVariants } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { getCurrentBorrower } from "@/lib/auth";
import { listBooks } from "@/lib/loans";
import { MIN_QUERY_LENGTH, searchBooks } from "@/lib/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Søk – Bibliotek",
	description: "Titlene i samlingen som svarer til søkeordet",
};

/**
 * The full answer to what the dropdown in the header only had room to sample.
 * A server component with the term read off the URL, so a search result is a
 * page like any other — it can be linked, bookmarked and reloaded.
 */
export default async function SearchPage({ searchParams }: PageProps<"/sok">) {
	const [books, viewer, { q }] = await Promise.all([
		listBooks(),
		getCurrentBorrower(),
		searchParams,
	]);

	const query = (typeof q === "string" ? q : "").trim();
	const matches = searchBooks(books, query);

	return (
		<>
			<PageHeading title="Søk">
				Treff i samlingen på tittel, forfatter eller ISBN. Søkefeltet står
				øverst på siden.
			</PageHeading>

			{query.length < MIN_QUERY_LENGTH ? (
				<Empty className="border bg-card">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
						</EmptyMedia>
						<EmptyTitle>Skriv et søkeord</EmptyTitle>
						<EmptyDescription>
							{query === ""
								? "Søket er tomt. Skriv en tittel, en forfatter eller et ISBN i feltet øverst."
								: "Søkeordet må være på minst to tegn. Skriv et tegn til i feltet øverst."}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Link href="/" className={buttonVariants({ variant: "outline" })}>
							Se hele samlingen
						</Link>
					</EmptyContent>
				</Empty>
			) : matches.length === 0 ? (
				<Empty className="border bg-card">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
						</EmptyMedia>
						<EmptyTitle>Ingen treff på «{query}»</EmptyTitle>
						<EmptyDescription>
							Ingen titler i samlingen svarer til søkeordet. Prøv et kortere
							søkeord, eller bla gjennom hele samlingen.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Link href="/" className={buttonVariants({ variant: "outline" })}>
							Se hele samlingen
						</Link>
					</EmptyContent>
				</Empty>
			) : (
				<BookTable
					books={matches}
					viewer={viewer}
					title={`Treff på «${query}»`}
					description={`${matches.length} av ${books.length} titler svarer til søkeordet.`}
					action={
						<Link
							href="/"
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							Se alle
						</Link>
					}
				/>
			)}
		</>
	);
}
