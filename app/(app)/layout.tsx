import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { getCurrentBorrower } from "@/lib/auth";

/**
 * The shell every screen in the lending system shares. `/stil` sits outside
 * this group and brings its own chrome.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentBorrower();

  return (
    <>
      <SiteHeader user={user} />
      {/*
       * `flex-1` lets main take the space left under the header, and the
       * min-height keeps that area open even when a page renders nothing —
       * the header wraps on narrow screens, so it is measured rather than
       * subtracted as a fixed number.
       */}
      <main className="mx-auto min-h-[60dvh] w-full max-w-225 flex-1 px-6 py-12">
        {children}
      </main>
    </>
  );
}
