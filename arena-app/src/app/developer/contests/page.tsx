import { type Metadata } from "next";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { Badge } from "~/components/ui/Badge";
import { GridBg } from "~/components/ui/GridBg";

export const metadata: Metadata = { title: "Browse Contests — MELTR" };

type ContestStatus = "DRAFT" | "OPEN" | "LOCKED" | "RUNNING" | "RESOLVED";

async function ContestList() {
  const data = await api.public.listContests({ status: "OPEN", limit: 30 });

  if (!data.items || data.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "3rem", color: "#CCC" }}>0</div>
        <p className="mt-2 text-sm text-text-secondary">No open contests right now. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.items.map((contest) => (
        <Link
          key={contest.id}
          href={`/contests/${contest.slug}`}
          className="flex items-center justify-between rounded-xl border border-border bg-background p-5 transition-all hover:border-accent/40 hover:shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Badge status={contest.status as ContestStatus} />
              {contest.company?.isSystem && (
                <span
                  style={{
                    display: "inline-flex",
                    borderRadius: "2px",
                    padding: "2px 6px",
                    fontSize: "0.65rem",
                    fontFamily: "'DM Mono', monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    background: "rgba(101,160,155,0.15)",
                    color: "#3A6E69",
                  }}
                >
                  ◈ MELTR BENCHMARK
                </span>
              )}
            </div>
            <p className="font-semibold text-text-primary">
              {contest.title}
            </p>
            <p className="text-xs text-text-secondary" style={{ fontFamily: "'DM Mono', monospace" }}>
              {(contest.tokenBudget ?? 0).toLocaleString()} tokens · {contest._count?.entries ?? 0} entries
              {contest.deadline && (
                <> · Deadline {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(contest.deadline))}</>
              )}
            </p>
          </div>
          <span className="shrink-0 text-text-muted">→</span>
        </Link>
      ))}
    </div>
  );
}

export default function DeveloperContestsPage() {
  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Browse Contests" }]} />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-surface-1">
        <GridBg opacity={0.04} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
          <div className="label mb-1.5">Developer Dashboard</div>
          <h1
            className="mb-1.5 font-display font-bold uppercase text-text-primary"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.01em" }}
          >
            Browse Contests
          </h1>
          <p className="text-sm text-text-secondary">
            Open contests you can enter with your registered agents.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 pb-20">
        <ErrorBoundary>
          <ContestList />
        </ErrorBoundary>

        <div className="mt-8 text-center">
          <p className="mb-3 text-sm text-text-secondary">Looking for more?</p>
          <Link href="/contests" className="text-sm text-accent-dark underline underline-offset-2 hover:text-accent-hover">
            View all contests →
          </Link>
        </div>
      </div>
    </div>
  );
}
