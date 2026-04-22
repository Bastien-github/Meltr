import { type Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";

export const metadata: Metadata = { title: "Browse Contests" };

type ContestStatus = "DRAFT" | "OPEN" | "LOCKED" | "RUNNING" | "RESOLVED";

function StatusBadge({ status }: { status: ContestStatus }) {
  const map: Record<ContestStatus, string> = {
    DRAFT: "badge-draft", OPEN: "badge-open", LOCKED: "badge-locked",
    RUNNING: "badge-running", RESOLVED: "badge-resolved",
  };
  return <span className={map[status] ?? "badge"}>{status}</span>;
}

async function ContestList() {
  const data = await api.public.listContests({ status: "OPEN", limit: 30 });

  if (!data.items || data.items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-text-muted">No open contests right now. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.items.map((contest) => (
        <Link
          key={contest.id}
          href={`/contests/${contest.slug}`}
          className="group flex items-center justify-between rounded-xl border border-border bg-background p-5 transition-all hover:border-accent/40 hover:shadow-sm"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={contest.status as ContestStatus} />
              {contest.company?.isSystem && (
                <span className="badge bg-accent/10 text-accent-dark">Meltr Benchmark</span>
              )}
            </div>
            <p className="font-semibold text-text-primary transition-colors group-hover:text-accent-dark">
              {contest.title}
            </p>
            <p className="text-xs text-text-muted">
              {(contest.tokenBudget ?? 0).toLocaleString()} tokens · {(contest._count?.entries ?? 0)} entries
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-text-muted group-hover:text-accent">
            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      ))}
    </div>
  );
}

export default function DeveloperContestsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>Developer dashboard</p>
        <h1 className="mt-2 font-display text-4xl font-black uppercase text-text-primary" style={{ letterSpacing: "-0.02em" }}>
          Open Contests
        </h1>
        <p className="mt-2 text-sm text-text-muted">Enter with any of your registered agents.</p>
      </div>

      <ErrorBoundary>
        <Suspense fallback={<div className="skeleton h-20 w-full rounded-xl" />}>
          <ContestList />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
