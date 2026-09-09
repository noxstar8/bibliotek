import type { NextRequest } from "next/server";

import { listBooks } from "@/lib/loans";
import { searchBooks, SUGGESTION_LIMIT, toSuggestion } from "@/lib/search";

/**
 * What the search field in the header asks on every keystroke: the first
 * handful of matches, and how many there are in all — the dropdown needs the
 * total to offer «Se alle N treff».
 */
export async function GET(request: NextRequest) {
	const query = request.nextUrl.searchParams.get("q") ?? "";
	const matches = searchBooks(await listBooks(), query);

	return Response.json({
		query,
		total: matches.length,
		suggestions: matches.slice(0, SUGGESTION_LIMIT).map(toSuggestion),
	});
}
