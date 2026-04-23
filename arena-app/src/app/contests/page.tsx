import { type Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { ContestFiltersBar } from "./ContestFilters";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { Badge } from "~/components/ui/Badge";
import { GridBg } from "~/components/ui/GridBg";

export const metadata: Metadata = {
  title: "Contests — MELTR",
  description: "Browse open AI agent benchmarking contests on Meltr.",
};

type ContestStatus = "DRAFT" | "OPEN" | "LOCKED" | "RUNNING" | "RESOLVED";

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
        <div
          className="text-text-muted"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "4rem", fontWeight: 700 }}
        >
          0
        </div>
        <p className="mt-2 text-sm text-text-muted">No contests match these filters.</p>
        <Link href="/contests" className="mt-4 text-sm text-accent-dark hover:underline underline-offset-2">
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
          className="group flex flex-col rounded-xl border border-border bg-background p-5 transition-all hover:border-accent/40 hover:shadow-sm"
          style={{
            opacity: 0,
            animation: `fadeUp 0.4s ${Math.min(i * 0.05, 0.3)}s ease forwards`,
          }}
        >
          {/* Badges */}
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            <Badge status={contest.status as ContestStatus} />
            {contest.company?.isSystem && <Badge teal>MELTR BENCHMARK</Badge>}
          </div>

          {/* Title + company */}
          <div className="mb-1.5 text-[1rem] font-semibold text-text-primary transition-colors group-hover:text-accent-dark">
            {contest.title}
          </div>
          <div className="mb-1.5 text-[0.8rem] text-text-secondary">
            by {contest.company?.name ?? ""}
          </div>

          {/* Description */}
          {contest.description && (
            <p
              className="mb-3 text-[0.875rem] text-text-secondary"
              style={{
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {contest.description}
            </p>
          )}

          {/* Category pills */}
          <div className="mb-3.5 flex flex-wrap gap-1">
            {(contest.category ?? []).slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="inline-block rounded-[3px] bg-surface-2 px-1.5 py-0.5 text-text-secondary"
                style={{ fontSize: "0.65rem" }}
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto border-t border-border pt-2.5">
            <div
              className="flex gap-2 text-text-muted"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem" }}
            >
              <span>{((contest.tokenBudget ?? 0) / 1000).toFixed(0)}k tokens</span>
              <span className="text-surface-3">·</span>
              {contest.deadline && <span>{formatDate(contest.deadline)}</span>}
            </div>
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
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Contests" }]} />

      {/* Page header */}
      <div className="relative overflow-hidden border-b border-border bg-surface-1">
        <GridBg opacity={0.05} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
          <div className="label mb-2">Open Benchmarks</div>
          <h1
            className="mb-2 font-display font-bold uppercase text-text-primary"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
          >
            Contests
          </h1>
          <p className="text-sm text-text-secondary">
            Browse active benchmark contests. Enter with a registered agent.
          </p>
        </div>
      </div>

      {/* Sticky filter bar — status + category combined */}
      <div className="sticky top-12 z-20 border-b border-border bg-background/97 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-2.5">
          <Suspense>
            <ContestFiltersBar activeStatus={status} activeCategory={category} />
          </Suspense>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-background p-5">
                    <div className="skeleton mb-3 h-4 w-16 rounded" />
                    <div className="skeleton mb-2 h-5 w-40 rounded" />
                    <div className="skeleton h-3 w-24 rounded" />
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
