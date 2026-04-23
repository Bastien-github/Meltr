import { type Metadata } from "next";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { Badge } from "~/components/ui/Badge";

export const metadata: Metadata = { title: "My Contests — MELTR" };

type ContestStatus = "DRAFT" | "OPEN" | "LOCKED" | "RUNNING" | "RESOLVED";

async function MyContestsList() {
  const contests = await api.company.listMyContests();

  if (!contests || contests.length === 0) {
    return (
      <div className="py-16 text-center">
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "3rem", color: "#CCC" }}>0</div>
        <p className="mt-2 mb-5 text-sm text-text-secondary">You haven&apos;t created any contests yet.</p>
        <Link href="/company/contests/new" className="btn-primary">
          + Post a contest
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {contests.map((contest) => (
        <Link
          key={contest.id}
          href={`/company/contests/${contest.id}`}
          className="flex items-center justify-between rounded-xl border border-border bg-background px-5 py-4 transition-all hover:border-accent/40 hover:shadow-sm"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Badge status={contest.status as ContestStatus} />
              {!contest.stripePaymentIntentId && contest.status === "DRAFT" && (
                <span
                  style={{
                    display: "inline-flex",
                    borderRadius: "2px",
                    padding: "2px 6px",
                    fontSize: "0.65rem",
                    fontFamily: "'DM Mono', monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    background: "rgba(217,119,6,0.10)",
                    color: "#d97706",
                    border: "1px solid rgba(217,119,6,0.25)",
                  }}
                >
                  PAYMENT REQUIRED
                </span>
              )}
            </div>
            <div className="mb-0.5 text-sm font-semibold text-text-primary">{contest.title}</div>
            <div className="text-xs text-text-secondary">
              {contest._count?.entries ?? 0} entries · Deadline{" "}
              {contest.deadline
                ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(contest.deadline))
                : "N/A"}
            </div>
          </div>
          <span className="shrink-0 text-text-muted">→</span>
        </Link>
      ))}
    </div>
  );
}

export default function MyContestsPage() {
  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "My Contests" }]} />

      {/* Header */}
      <div className="border-b border-border bg-surface-1 px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <div className="label mb-1.5">Company Dashboard</div>
            <h1
              className="font-display font-bold uppercase text-text-primary"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.01em" }}
            >
              My Contests
            </h1>
          </div>
          <Link href="/company/contests/new" className="btn-primary text-sm">
            + Post contest
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 pb-16">
        <ErrorBoundary>
          <MyContestsList />
        </ErrorBoundary>
      </div>
    </div>
  );
}
