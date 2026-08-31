"use client";

import Link from "next/link";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  BookOpen01Icon,
  Delete02Icon,
  MoreVerticalIcon,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { collectReservationAction, deleteReservationAction } from "@/lib/actions";
import type { ReservationView } from "@/lib/loans";

/**
 * The row actions in the queue at the desk: hand the book over, or take the
 * entry out of the queue.
 *
 * This is a client component because the confirmation cannot be a plain
 * `AlertDialogTrigger` inside a menu item — the menu unmounts its popup the
 * instant an item is pressed, taking the trigger with it before the dialog ever
 * opens. Holding the dialog open in state, as a sibling of the menu rather than
 * a child of it, is what makes the two work together.
 */
export function ReservationActions({
  reservation,
  canCollect,
}: {
  reservation: ReservationView;
  /** Whether a copy is actually in the building to hand over right now. */
  canCollect: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  const title = reservation.book?.title ?? "ukjent tittel";
  const name = reservation.borrower?.name ?? "ukjent låner";
  const collectId = `hent-${reservation.id}`;
  const deleteId = `slett-${reservation.id}`;

  return (
    <>
      {/* Both forms sit outside the two popups. A menu closes the instant an
          item is pressed and a dialog is rendered in a portal, so in either case
          the button and the form are nowhere near each other in the DOM — the
          native `form` attribute is what ties them together. */}
      <form id={collectId} action={collectReservationAction} className="hidden">
        <input type="hidden" name="reservationId" value={reservation.id} />
        <input type="hidden" name="borrowerName" value={name} />
      </form>
      <form id={deleteId} action={deleteReservationAction} className="hidden">
        <input type="hidden" name="reservationId" value={reservation.id} />
        <input type="hidden" name="title" value={title} />
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label={`Handlinger for «${title}» reservert av ${name}`}
        >
          <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {canCollect ? (
            <DropdownMenuItem
              nativeButton
              render={<button type="submit" form={collectId} />}
            >
              <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />
              Lån ut til {name}
            </DropdownMenuItem>
          ) : (
            // No button at all rather than one that would be refused: the row
            // says why instead.
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              Ingen eksemplarer inne å låne ut ennå
            </DropdownMenuLabel>
          )}
          {reservation.book ? (
            <DropdownMenuItem render={<Link href={`/boker/${reservation.book.id}`} />}>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              Åpne boken
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            nativeButton
            variant="destructive"
            onClick={() => setConfirming(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Slett reservasjonen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>Slette reservasjonen på «{title}»?</AlertDialogTitle>
            <AlertDialogDescription>
              {name} står ikke lenger i køen og må reservere på nytt for å komme
              inn i den igjen — bakerst. Er et eksemplar satt av, går det med én
              gang videre til neste som venter. Handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction type="submit" form={deleteId} variant="destructive">
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              Slett reservasjonen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
