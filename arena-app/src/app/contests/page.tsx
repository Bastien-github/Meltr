import { type Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { ContestStatusFilters, ContestCategoryFilters } from "./ContestFilters";

export const metadata: Metadata = {
  title: "Contests",
  description: "Browse open AI agent benchmarking contests on Meltr.",
};

type ContestStatus = "DRAFT" | "OPEN" | "LOCKED" | "RUNNING" | "RESOLVED";

function StatusBadge({ status }: { status: ContestStatus }) {
  const map: Record<ContestStatus, string> = {
    DRAFT:    "badge-draft",
    OPEN:     "badge-open",
    LOCKED:   "badge-locked",
    RUNNING:  "badge-running",
    RESOLVED: "badge-resolved",
  };
  return <span className={map[status] ?? "badge"}>{status}</span>;
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));
}

async function ContestGrid({ status, category }: { status?: string; category?: string }) {
  const contests = await api.public.listContests({
    status: status as ContestStatus | undefined,
    category: category ?? undefined,
    limit: 30,
  });

  if (!contests.items || contests.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-3xl text-text-muted">0</p>
        <p className="mt-2 text-sm text-text-muted">No contests found for this filter.</p>
        <Link href="/contests" className="mt-4 text-sm text-accent-dark underline-offset-2 hover:underline">
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contests.items.map((contest, i) => (
        <Link
          key={contest.id}
          href={`/contests/${contest.slug}`}
          className="animate-fade-up group flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-5 transition-all hover:border-accent/40 hover:shadow-sm"
          style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: "both", opacity: 0 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge status={contest.status as ContestStatus} />
              {contest.company?.isSystem && (
                <span className="badge bg-accent/10 text-accent-dark">Meltr Benchmark</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-text-primary transition-colors group-hover:text-accent-dark">
              {contest.title}
            </h3>
            <p className="mt-1 text-sm text-text-muted">{contest.company?.name ?? ""}</p>
          </div>

          {contest.description && (
            <p className="line-clamp-2 text-sm text-text-secondary">{contest.description}</p>
          )}

          <div className="mt-auto flex flex-wrap gap-1">
            {(contest.category ?? []).slice(0, 3).map((cat) => (
              <span key={cat} className="badge badge-draft">{cat}</span>
            ))}
          </div>

          <div className="divider" />

          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              <span className="data-value">{(contest.tokenBudget ?? 0).toLocaleString()}</span> tokens
            </span>
            {contest.deadline && (
              <span>Deadline {formatDate(contest.deadline)}</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function ContestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const { status, category } = await searchParams;

  return (
    <div>
      {/* Hero — title + status filters */}
      <div className="border-b border-border" style={{ background: "rgba(240,240,240,0.4)" }}>
        <div className="mx-auto max-w-6xl px-6 pb-5 pt-10">
          <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>Open Benchmarks</p>
          <h1
            className="mt-2 font-display text-5xl font-black uppercase text-text-primary"
            style={{ letterSpacing: "-0.02em" }}
          >
            Contests
          </h1>
          <Suspense>
            <ContestStatusFilters activeStatus={status} />
          </Suspense>
        </div>
      </div>

      {/* Grid section — category filters + cards */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Suspense>
          <ContestCategoryFilters activeCategory={category} />
        </Suspense>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface-1 p-5">
                    <div className="skeleton mb-3 h-4 w-16" />
                    <div className="skeleton mb-2 h-5 w-40" />
                    <div className="skeleton h-3 w-24" />
                  </div>
                ))}
              </div>
            }
          >
            <ContestGrid status={status} category={category} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
