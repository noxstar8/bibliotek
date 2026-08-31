import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { registerReturn, type LoanError } from "@/lib/loans";

const status: Record<LoanError, number> = {
  "book-not-found": 404,
  "no-copies-available": 409,
  "loan-not-found": 404,
  "already-returned": 409,
};

/** Takes a book back into the collection. */
export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/loans/[id]/return">
) {
  const { id } = await context.params;
  const result = await registerReturn(id);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: status[result.error] });
  }

  revalidatePath("/");
  revalidatePath("/mine-laan");
  revalidatePath("/admin");
  revalidatePath("/admin/reservasjoner");
  revalidatePath(`/boker/${result.loan.bookId}`);

  // `promoted` is who the freed copy was put aside for — empty when nobody was
  // waiting for the title.
  return Response.json({ loan: result.loan, promoted: result.promoted });
}
