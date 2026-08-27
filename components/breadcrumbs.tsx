import Link from "next/link";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * The trail above a page that sits *below* the administration rather than
 * beside it. The tab row in the administration says which of the desk views you
 * are in; once you have opened a single record it can no longer say that, so
 * these pages carry the way back themselves.
 *
 * The last step is where you already are, so it is a plain label rather than a
 * link. Separators are siblings of the steps, not children of them — they are
 * list items in the same list.
 */
export function Breadcrumbs({
  trail,
}: {
  trail: { label: string; href?: string }[];
}) {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {trail.map((step, index) => (
          <Fragment key={step.href ?? step.label}>
            <BreadcrumbItem>
              {step.href ? (
                <BreadcrumbLink render={<Link href={step.href} />}>
                  {step.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate">{step.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < trail.length - 1 ? <BreadcrumbSeparator /> : null}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
