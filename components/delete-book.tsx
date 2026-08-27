"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Delete02Icon } from "@hugeicons/core-free-icons";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { deleteBookAction } from "@/lib/actions";

/** "1 eksemplar" / "3 eksemplarer" — the unit follows the count. */
function copies(count: number): string {
  return `${count} ${count === 1 ? "eksemplar" : "eksemplarer"}`;
}

/**
 * The danger zone at the foot of the edit page: a quiet inset row rather than a
 * red button loose in the layout, and a confirmation before anything happens.
 *
 * While copies are out on loan the row does not offer the action at all. The
 * server refuses it too — this is the explanation, not the guard.
 */
export function DeleteBook({
  bookId,
  title,
  onLoan,
}: {
  bookId: string;
  title: string;
  onLoan: number;
}) {
  const formId = `slett-${bookId}`;

  if (onLoan > 0) {
    return (
      <Item variant="outline" className="border-destructive/25">
        <ItemMedia
          variant="icon"
          className="size-9 rounded-xl bg-destructive/10 text-destructive"
        >
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Boken kan ikke slettes nå</ItemTitle>
          <ItemDescription>
            {copies(onLoan)} er ute på lån. Registrer retur på alle sammen før
            tittelen kan tas ut av katalogen.
          </ItemDescription>
        </ItemContent>
      </Item>
    );
  }

  return (
    <AlertDialog>
      {/* The form sits outside the dialog. Its popup is rendered in a portal,
          so a submit button inside it is nowhere near the form in the DOM — the
          native `form` attribute is what ties the two together. */}
      <form id={formId} action={deleteBookAction} className="hidden">
        <input type="hidden" name="bookId" value={bookId} />
      </form>

      <Item variant="outline" className="border-destructive/25">
        <ItemMedia
          variant="icon"
          className="size-9 rounded-xl bg-destructive/10 text-destructive"
        >
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Slett boken</ItemTitle>
          <ItemDescription>
            Tittelen forsvinner fra katalogen og kan ikke lånes ut igjen.
            Handlingen kan ikke angres.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <AlertDialogTrigger
            className={buttonVariants({ variant: "destructive", size: "sm" })}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Slett
          </AlertDialogTrigger>
        </ItemActions>
      </Item>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          </AlertDialogMedia>
          <AlertDialogTitle>Slette «{title}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Boken tas ut av katalogen for godt og kan ikke lånes ut igjen.
            Lånehistorikken blir stående, for den forteller hva som faktisk
            skjedde. Handlingen kan ikke angres.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction type="submit" form={formId} variant="destructive">
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Slett boken
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
