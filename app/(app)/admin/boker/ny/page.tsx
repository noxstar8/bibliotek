import type { Metadata } from "next";

import { BookForm } from "@/components/book-form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LibrarianRequired } from "@/components/librarian-required";
import { PageHeading } from "@/components/page-heading";
import { createBookAction } from "@/lib/actions";
import { isLibrarian, requireBorrower } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ny bok – Bibliotek",
  description: "Legg en tittel inn i katalogen",
};

export default async function NewBookPage() {
  const user = await requireBorrower();
  if (!isLibrarian(user)) {
    return (
      <>
        <PageHeading title="Ny bok" />
        <LibrarianRequired user={user} />
      </>
    );
  }

  return (
    <>
      <Breadcrumbs
        trail={[
          { label: "Administrasjon", href: "/admin" },
          { label: "Bøker", href: "/admin/boker" },
          { label: "Ny bok" },
        ]}
      />
      <PageHeading title="Ny bok">
        Registrer en tittel biblioteket har skaffet. Antall eksemplarer avgjør
        hvor mange lån som kan løpe på den samtidig.
      </PageHeading>

      <BookForm action={createBookAction} />
    </>
  );
}
