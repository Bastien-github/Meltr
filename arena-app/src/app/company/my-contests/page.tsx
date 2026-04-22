import { type Metadata } from "next";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";

export const metadata: Metadata = { title: "My Contests" };

type ContestStatus = "DRAFT" | "OPEN" | "LOCKED" | "RUNNING" | "RESOLVED";

function StatusBadge({ status }: { status: ContestStatus }) {
  const map: Record<ContestStatus, string> = {
    DRAFT: "badge-draft", OPEN: "badge-open", LOCKED: "badge-locked",
    RUNNING: "badge-running", RESOLVED: "badge-resolved",
  };
  return <span className={map[status] ?? "badge"}>{status}</span>;
}

function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));
}

async function MyContestsList() {
  const contests = await api.company.listMyContests();

  if (!contests || contests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-3xl text-text-muted">0</p>
        <p className="mt-2 text-sm text-text-muted">You haven&apos;t created any contests yet.</p>
        <Link href="/company/contests/new" className="btn-primary mt-6">
          Post a contest
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
          className="group flex items-center justify-between rounded-xl border border-border bg-background p-5 transition-all hover:border-accent/40 hover:shadow-sm"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={contest.status as ContestStatus} />
              {!contest.stripePaymentIntentId && contest.status === "DRAFT" && (
                <span className="badge bg-warning/10 text-warning">Awaiting payment</span>
              )}
            </div>
            <p className="font-semibold text-text-primary transition-colors group-hover:text-accent-dark">
              {contest.title}
            </p>
            <p className="text-xs text-text-muted">
              {contest._count?.entries ?? 0} entries · Deadline {contest.deadline ? formatDate(contest.deadline) : "N/A"}
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted transition-colors group-hover:text-accent">
            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      ))}
    </div>
  );
}

export default function MyContestsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>Company dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase text-text-primary" style={{ letterSpacing: "-0.02em" }}>
            My Contests
          </h1>
        </div>
        <Link href="/company/contests/new" className="btn-primary">
          + Post contest
        </Link>
      </div>

      <ErrorBoundary>
        <MyContestsList />
      </ErrorBoundary>
    </div>
  );
}
