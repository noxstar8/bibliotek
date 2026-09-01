import type { ReactNode } from "react";

/** One figure with its label above it, the way the stat blocks read elsewhere. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
