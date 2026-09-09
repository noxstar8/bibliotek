"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowRight01Icon,
	Book02Icon,
	Search01Icon,
} from "@hugeicons/core-free-icons";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { MIN_QUERY_LENGTH, type Suggestion } from "@/lib/search";
import { cn } from "@/lib/utils";

/**
 * The search field in the header.
 *
 * The form underneath is a plain `GET` to `/sok`, so Enter finds books with
 * JavaScript switched off. Everything else here is the enhancement laid on
 * top: suggestions fetched while you type, and the keyboard walking them.
 *
 * This is the only client component in the search — the results page reads the
 * same term off the URL on the server.
 */

/** Long enough that a fast typist makes one request, short enough to feel live. */
const DEBOUNCE_MS = 150;

type SearchResponse = {
	query: string;
	/** Matches in all — more than the suggestions, when there are many. */
	total: number;
	suggestions: Suggestion[];
};

/**
 * Where the field reads the URL.
 *
 * The key remounts the field on every navigation, which is the whole of
 * "starts from the URL again, with the dropdown shut": a fresh field takes its
 * term from `?q=`, opens closed, and the unmount aborts whatever request the
 * last keystroke had in the air. Syncing that by hand would take three effects
 * writing state the render already knows.
 */
export function SiteSearch({ className }: { className?: string }) {
	const pathname = usePathname();
	const query = useSearchParams().get("q") ?? "";

	return (
		<SearchField
			key={`${pathname}?${query}`}
			className={className}
			initialQuery={query}
		/>
	);
}

function SearchField({
	className,
	initialQuery,
}: {
	className?: string;
	initialQuery: string;
}) {
	const router = useRouter();

	const [query, setQuery] = useState(initialQuery);
	const [open, setOpen] = useState(false);
	const [result, setResult] = useState<SearchResponse | null>(null);
	const [active, setActive] = useState(-1);

	const containerRef = useRef<HTMLDivElement>(null);

	/**
	 * Whether the dropdown is still wanted. Typing raises it; Escape, a click
	 * outside and following a suggestion lower it. A request already in the air
	 * when it goes down must not reopen what the reader has just closed — and on
	 * the results page, where the field arrives filled in from the URL, nothing
	 * has been typed yet and nothing should open.
	 */
	const wantedRef = useRef(false);

	const listboxId = useId();
	const optionId = (index: number) => `${listboxId}-${index}`;

	const term = query.trim();
	const suggestions = result?.suggestions ?? [];
	const total = result?.total ?? 0;

	// Below the minimum there is nothing to show, so the answer to a longer term
	// still standing in `result` is hidden rather than cleared.
	const showing = open && result !== null && term.length >= MIN_QUERY_LENGTH;

	function close() {
		wantedRef.current = false;
		setOpen(false);
		setActive(-1);
	}

	useEffect(() => {
		if (!wantedRef.current) return;

		const wanted = query.trim();
		if (wanted.length < MIN_QUERY_LENGTH) return;

		const controller = new AbortController();
		const timer = setTimeout(() => {
			fetch(`/api/search?q=${encodeURIComponent(wanted)}`, {
				signal: controller.signal,
			})
				.then((response) => {
					if (!response.ok) throw new Error("Søket svarte ikke");
					return response.json() as Promise<SearchResponse>;
				})
				.then((data) => {
					if (!wantedRef.current) return;
					setResult(data);
					setActive(-1);
					setOpen(true);
				})
				.catch(() => {
					// An abort is a newer keystroke winning, not a failure. Anything
					// else leaves the field working as the plain form it is built on.
					if (controller.signal.aborted) return;
					setOpen(false);
				});
		}, DEBOUNCE_MS);

		// Both halves matter: the timer for a keystroke inside the pause, the
		// abort for one after the request went out. Without the abort a slow
		// answer could land on top of a newer one.
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [query]);

	useEffect(() => {
		if (!showing) return;

		function handlePointerDown(event: PointerEvent) {
			if (containerRef.current?.contains(event.target as Node)) return;
			close();
		}

		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, [showing]);

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Escape") {
			if (!showing) return;
			// A `type="search"` field empties itself on Escape, and the term is the
			// one thing the reader wants left standing.
			event.preventDefault();
			close();
			return;
		}

		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			if (!showing || suggestions.length === 0) return;
			event.preventDefault();
			setActive((current) => {
				const next = event.key === "ArrowDown" ? current + 1 : current - 1;
				// No wrapping. The last suggestion is the last one, and stepping back
				// off the first lands in the field again, ready to send the search.
				return Math.min(Math.max(next, -1), suggestions.length - 1);
			});
			return;
		}

		if (event.key === "Enter" && showing && active >= 0) {
			const chosen = suggestions[active];
			if (!chosen) return;
			// Holds back the form: a marked suggestion is a book, not a search.
			event.preventDefault();
			close();
			router.push(`/boker/${chosen.id}`);
		}
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		close();
		router.push(term === "" ? "/sok" : `/sok?q=${encodeURIComponent(term)}`);
	}

	const answered = result?.query ?? "";
	const announcement = !showing
		? ""
		: total === 0
			? `Ingen treff på «${answered}»`
			: `${total} treff på «${answered}»`;

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			<form method="get" action="/sok" role="search" onSubmit={handleSubmit}>
				<InputGroup>
					<InputGroupAddon>
						<HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
					</InputGroupAddon>
					<InputGroupInput
						type="search"
						name="q"
						value={query}
						placeholder="Søk i samlingen"
						aria-label="Søk i samlingen etter tittel, forfatter eller ISBN"
						autoComplete="off"
						role="combobox"
						aria-expanded={showing}
						aria-controls={listboxId}
						aria-autocomplete="list"
						aria-activedescendant={active >= 0 ? optionId(active) : undefined}
						onChange={(event) => {
							wantedRef.current = true;
							setQuery(event.target.value);
							setActive(-1);
						}}
						onKeyDown={handleKeyDown}
					/>
				</InputGroup>
			</form>

			<div aria-live="polite" aria-atomic="true" className="sr-only">
				{announcement}
			</div>

			{/* Kept in the tree while shut, so `aria-controls` always points at a
			    list that is really there. */}
			<div
				hidden={!showing}
				className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-2xl bg-popover text-sm text-popover-foreground shadow-2xl ring-1 ring-foreground/5 dark:ring-foreground/10"
			>
				<ul
					id={listboxId}
					role="listbox"
					aria-label="Søkeforslag"
					className="max-h-[28rem] overflow-y-auto p-1.5"
				>
					{result === null ? null : suggestions.length > 0 ? (
						suggestions.map((book, index) => (
							<li
								key={book.id}
								id={optionId(index)}
								role="option"
								aria-selected={index === active}
								data-active={index === active}
								className="group/option rounded-xl data-[active=false]:hover:bg-muted data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
							>
								<Link
									href={`/boker/${book.id}`}
									onClick={close}
									className="flex items-center gap-3 px-2 py-2"
								>
									<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted group-data-[active=true]/option:bg-accent-foreground/20">
										<HugeiconsIcon
											icon={Book02Icon}
											strokeWidth={2}
											className="size-4 text-muted-foreground group-data-[active=true]/option:text-accent-foreground"
										/>
									</span>
									<span className="flex min-w-0 flex-col leading-snug">
										<span className="truncate font-medium">{book.title}</span>
										<span className="truncate text-muted-foreground group-data-[active=true]/option:text-accent-foreground/80">
											{book.author} · {book.year}
										</span>
									</span>
								</Link>
							</li>
						))
					) : (
						// Not a reason to shut: someone who typed a word deserves to be
						// told it found nothing, rather than left with a silent field.
						<li role="presentation" className="px-3 py-3 text-muted-foreground">
							Ingen treff på «{answered}»
						</li>
					)}
				</ul>

				{total > suggestions.length ? (
					<Link
						href={`/sok?q=${encodeURIComponent(answered)}`}
						onClick={close}
						className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5 font-medium hover:bg-muted"
					>
						Se alle {total} treff
						<HugeiconsIcon
							icon={ArrowRight01Icon}
							strokeWidth={2}
							className="size-4"
						/>
					</Link>
				) : null}
			</div>
		</div>
	);
}
