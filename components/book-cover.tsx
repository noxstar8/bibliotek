"use client";

import Image from "next/image";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { Book02Icon } from "@hugeicons/core-free-icons";

import { coverUrl, type CoverSize } from "@/lib/covers";
import { cn } from "@/lib/utils";

/**
 * The cover of a book, falling back to an icon tile when there is no image.
 *
 * A client component for one reason: a cover that is missing has to be found
 * out at load time. Open Library holds no image for every ISBN, and the answer
 * only arrives when the browser asks — so `onError` swaps in the fallback, and
 * a title without a cover reads as a deliberate tile rather than a broken
 * picture. The same fallback covers a book whose ISBN is malformed, where
 * `coverUrl` returns `null` and no request is made at all.
 *
 * Sizing belongs to the caller, through `className`: the tile beside a table
 * row is a `size-9` square, the carousel's cover fills the card's width. This
 * component only fills the box it is given.
 *
 * The fill is the ground darkened a step, not `bg-muted`: this preset sets
 * `--muted` and `--background` to the same value, so a muted tile reads as a
 * hole punched in the card rather than a surface of its own. Tinting
 * `foreground` keeps the warm taupe tone and follows dark mode, where the step
 * has to lighten rather than darken.
 */
export function BookCover({
  isbn,
  title,
  size = "M",
  className,
  fallbackIcon = Book02Icon,
  sizes,
}: {
  isbn: string;
  /** Named in the alt text, so a reader hears which cover this is. */
  title: string;
  size?: CoverSize;
  className?: string;
  /** Lets a row keep the icon it would otherwise have shown. */
  fallbackIcon?: IconSvgElement;
  /** Passed through to `next/image`; set it wherever the box is not fixed. */
  sizes?: string;
}) {
  const source = coverUrl(isbn, size);

  // Keyed on the source rather than held plainly: React reuses this instance
  // when only the props change — the same tile moving from one book to the
  // next — and a `failed` left standing from the previous cover would hide an
  // image that does exist. Resetting on render is the documented way to drop
  // state when an input changes; an effect would show the fallback for a frame
  // first.
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState(source);
  if (lastSource !== source) {
    setLastSource(source);
    setFailedFor(null);
  }
  const failed = failedFor !== null && failedFor === source;

  if (!source || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-foreground/8 text-muted-foreground dark:bg-foreground/10",
          className
        )}
      >
        <HugeiconsIcon icon={fallbackIcon} strokeWidth={2} className="size-4" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-foreground/8 dark:bg-foreground/10",
        className
      )}
    >
      {/* `fill` rather than width/height: the sizes come from the box the
      caller styled, and Next cannot measure a remote image at build time.
      `object-cover` because covers are not all one shape — a tall spine and a
      square reissue both have to fill the same tile without distorting. */}
      <Image
        src={source}
        alt={`Omslag av «${title}»`}
        fill
        sizes={sizes ?? "96px"}
        className="object-cover"
        onError={() => setFailedFor(source)}
      />
    </div>
  );
}
