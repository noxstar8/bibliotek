"use client";

import Link from "next/link";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";

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
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteBookAction } from "@/lib/actions";

/** "1 eksemplar" / "3 eksemplarer" — the unit follows the count. */
function copies(count: number): string {
  return `${count} ${count === 1 ? "eksemplar" : "eksemplarer"}`;
}

/**
 * The overflow menu on a catalogue row: edit, open, and — behind a
 * confirmation — delete.
 *
 * The dialog is opened from state rather than from an `AlertDialogTrigger`.
 * The menu unmounts its popup the instant an item is pressed, so a trigger
 * living inside it would be gone before it could open anything.
 *
 * While copies are out on loan the delete item is dead and says why. The server
 * refuses the deletion too — this is the explanation, not the guard.
 */
export function BookRowActions({
  bookId,
  title,
  onLoan,
}: {
  bookId: string;
  title: string;
  onLoan: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const formId = `slett-${bookId}`;

  return (
    <>
      {/* Outside both popups. A menu closes the instant an item is pressed and
          the dialog is portalled away from this row, so neither can hold a form
          that has to survive the submit — the native `form` attribute ties the
          button to it instead. */}
      <form id={formId} action={deleteBookAction} className="hidden">
        <input type="hidden" name="bookId" value={bookId} />
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label={`Handlinger for «${title}»`}
        >
          <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem render={<Link href={`/admin/boker/${bookId}`} />}>
            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
            Rediger boken
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/boker/${bookId}`} />}>
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            Se bok
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {onLoan > 0 ? (
            <DropdownMenuItem disabled className="flex-col items-start gap-0.5">
              <span className="flex items-center gap-2.5">
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                Kan ikke slettes nå
              </span>
              <span className="pl-6.5 text-xs">
                {copies(onLoan)} er ute på lån
              </span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirming(true)}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              Slett boken
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
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
    </>
  );
}
