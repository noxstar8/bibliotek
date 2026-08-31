"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";

const views = [
  { href: "/admin", label: "Aktive lån" },
  // Next to the loans, not last: lending out and taking in are the same desk
  // work, and the queue is where a returned copy goes.
  { href: "/admin/reservasjoner", label: "Reservasjoner" },
  { href: "/admin/boker", label: "Bøker" },
  { href: "/admin/brukere", label: "Brukere" },
  { href: "/admin/innstillinger", label: "Innstillinger" },
];

/**
 * The desk views, switched between without leaving the administration.
 *
 * Only the top of each view is listed. A page below one of them — a single book
 * being edited, say — carries breadcrumbs instead, because a tab row cannot say
 * where you are once you are one level down.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Administrasjon" className="mb-8">
      <ul className="flex flex-wrap items-center gap-1">
        {views.map((view) => {
          const current = pathname === view.href;

          return (
            <li key={view.href}>
              <Link
                href={view.href}
                aria-current={current ? "page" : undefined}
                className={buttonVariants({
                  variant: current ? "secondary" : "ghost",
                  size: "sm",
                  className: current ? undefined : "text-muted-foreground",
                })}
              >
                {view.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
