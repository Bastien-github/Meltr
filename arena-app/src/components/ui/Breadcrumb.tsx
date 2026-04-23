import Link from "next/link";
import { Fragment } from "react";

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-1.5 px-6">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <Fragment key={i}>
              {i > 0 && (
                <span className="text-xs text-surface-3 select-none">/</span>
              )}
              {isLast || !c.href ? (
                <span className="text-[0.8rem] font-medium text-text-primary">
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="text-[0.8rem] text-text-muted transition-colors hover:text-accent-dark"
                >
                  {c.label}
                </Link>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
