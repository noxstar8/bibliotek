"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockKeyIcon, UserSettings01Icon } from "@hugeicons/core-free-icons";

import { roleLabel } from "@/components/role-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateRoleAction } from "@/lib/actions";
import type { RoleRefusal } from "@/lib/borrowers";
import type { Role } from "@/lib/types";

/**
 * The two cases that can be refused, and what the page says about each.
 *
 * Deliberately its own wording rather than `lib/errors.ts`: those messages are
 * written for *after* a refused submit («Rollen står uendret»), which reads
 * oddly on a page where nothing has been attempted yet. Typed against the two
 * codes that can actually reach here, so adding a third is a compile error
 * rather than a page quietly showing the wrong explanation.
 */
const refusals: Record<RoleRefusal, { title: string; description: string }> = {
  "cannot-demote-self": {
    title: "Du kan ikke endre din egen rolle",
    description:
      "Gjorde du deg selv til låner, mistet du administrasjonen i samme øyeblikk — også denne siden. Be en annen bibliotekar om å gjøre det for deg.",
  },
  "last-librarian": {
    title: "Rollen kan ikke endres nå",
    description:
      "Dette er den eneste bibliotekaren i registeret. Blir hen låner, har ingen tilgang til administrasjonen, og rollen kan ikke settes tilbake herfra. Gjør en annen til bibliotekar først.",
  },
};

/**
 * The role control at the foot of a user's page: a quiet card with the two
 * choices, or an explanation when the change is one of the two that are refused.
 *
 * `refusal` is worked out on the server and passed in, so the wording and the
 * rule cannot drift apart. The server refuses it too — this is the explanation,
 * not the guard. The check here races the write, which is exactly why the real
 * rule lives inside the queued operation in `setBorrowerRole`.
 */
export function BorrowerRole({
  borrowerId,
  name,
  role,
  refusal,
}: {
  borrowerId: string;
  name: string;
  role: Role;
  refusal: RoleRefusal | null;
}) {
  const [chosen, setChosen] = useState<Role>(role);

  if (refusal) {
    const { title, description } = refusals[refusal];

    return (
      <Item variant="outline">
        <ItemMedia variant="icon" className="size-9 rounded-xl bg-muted">
          <HugeiconsIcon icon={LockKeyIcon} strokeWidth={2} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{title}</ItemTitle>
          <ItemDescription>{description}</ItemDescription>
        </ItemContent>
      </Item>
    );
  }

  return (
    <form action={updateRoleAction}>
      <input type="hidden" name="borrowerId" value={borrowerId} />
      <Card>
        <CardHeader>
          <CardTitle>Rolle</CardTitle>
          <CardDescription>
            Bibliotekarer ser administrasjonen, registrerer retur og leverer ut
            reserverte bøker. Lånere ser bare sine egne lån.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field className="sm:max-w-xs">
            <FieldLabel htmlFor="rolle">Rolle</FieldLabel>
            <Select
              name="role"
              value={chosen}
              onValueChange={(value) => setChosen(value as Role)}
            >
              <SelectTrigger id="rolle" className="w-full">
                {/* The label is spelled out rather than left to the primitive:
                    on the server there are no mounted items to look a value up
                    in, so a bare `SelectValue` renders the raw "borrower" for
                    the first paint. */}
                <SelectValue>{() => roleLabel(chosen)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="borrower">Låner</SelectItem>
                <SelectItem value="librarian">Bibliotekar</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>
              Endringen gjelder med én gang, både for {name} og i brukerlisten.
            </FieldDescription>
          </Field>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={chosen === role}>
            <HugeiconsIcon icon={UserSettings01Icon} strokeWidth={2} />
            Lagre rolle
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
