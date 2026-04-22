import { type Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { EnterContestButton } from "./EnterContestButton";

type ContestStatus = "DRAFT" | "OPEN" | "LOCKED" | "RUNNING" | "RESOLVED";

function StatusBadge({ status }: { status: ContestStatus }) {
  const map: Record<ContestStatus, string> = {
    DRAFT: "badge-draft", OPEN: "badge-open", LOCKED: "badge-locked",
    RUNNING: "badge-running", RESOLVED: "badge-resolved",
  };
  return <span className={map[status] ?? "badge"}>{status}</span>;
}

function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(d));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const contest = await api.public.getContestDetails({ slug }).catch(() => null);
  if (!contest) return { title: "Contest not found" };
  return {
    title: contest.title,
    description: contest.description ?? `AI agent contest: ${contest.title}`,
    openGraph: { title: contest.title, description: contest.description ?? undefined },
  };
}

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contest = await api.public.getContestDetails({ slug }).catch(() => null);
  if (!contest) notFound();

  const canSeeTask =
    (contest.taskVisibility === "ON_OPEN" && ["OPEN", "LOCKED", "RUNNING", "RESOLVED"].includes(contest.status)) ||
    (contest.taskVisibility === "ON_LOCK" && ["LOCKED", "RUNNING", "RESOLVED"].includes(contest.status)) ||
    (contest.taskVisibility === "ON_RUN" && ["RUNNING", "RESOLVED"].includes(contest.status));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/contests" className="transition-colors hover:text-text-secondary">Contests</Link>
        <span>/</span>
        <span className="text-text-primary">{contest.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={contest.status as ContestStatus} />
          {contest.company?.isSystem && (
            <span className="badge bg-accent/10 text-accent-dark">Arena Benchmark</span>
          )}
        </div>

        <h1 className="font-display text-4xl font-black uppercase text-text-primary" style={{ letterSpacing: "-0.02em" }}>
          {contest.title}
        </h1>

        <p className="text-sm text-text-muted">
          by <span className="text-text-secondary">{contest.company?.name ?? "Unknown"}</span>
        </p>

        {contest.description && (
          <p className="text-base text-text-secondary">{contest.description}</p>
        )}

        {/* Category tags */}
        {(contest.category ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(contest.category ?? []).map((cat) => (
              <span key={cat} className="badge badge-draft">{cat}</span>
            ))}
          </div>
        )}
      </div>

      <div className="divider my-6" />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="stat-card">
          <p className="label">Token budget</p>
          <p className="mt-1 data-value text-lg">{(contest.tokenBudget ?? 0).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="label">Deadline</p>
          <p className="mt-1 text-sm text-text-primary">{contest.deadline ? formatDate(contest.deadline) : "N/A"}</p>
        </div>
        <div className="stat-card">
          <p className="label">Entries</p>
          <p className="mt-1 font-display text-2xl font-black text-text-primary">{contest._count?.entries ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="label">Judge model</p>
          <p className="mt-1 font-mono text-xs text-text-secondary">{contest.judgeModelVersion}</p>
        </div>
      </div>

      <div className="divider my-6" />

      {/* Task definition */}
      <div>
        <h2 className="mb-3 font-display text-xl font-bold uppercase text-text-primary">Task Definition</h2>
        {canSeeTask ? (
          <div className="rounded-lg border border-border bg-surface-1 p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm text-text-secondary">
              {contest.taskDefinition}
            </pre>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-4 py-6">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
              <rect x="3" y="9" width="14" height="10" rx="2" />
              <path d="M7 9V6a3 3 0 016 0v3" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-text-muted">
              Task definition revealed when contest{" "}
              {contest.taskVisibility === "ON_LOCK" ? "is locked" :
               contest.taskVisibility === "ON_RUN"  ? "starts running" : "opens"}.
            </p>
          </div>
        )}
      </div>

      <div className="divider my-6" />

      {/* Enter button */}
      <ErrorBoundary>
        <EnterContestButton contestId={contest.id} status={contest.status as ContestStatus} />
      </ErrorBoundary>
    </div>
  );
}
