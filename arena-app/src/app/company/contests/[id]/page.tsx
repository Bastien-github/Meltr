"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

type ContestStatus = "DRAFT" | "OPEN" | "LOCKED" | "RUNNING" | "RESOLVED";

function StatusBadge({ status }: { status: ContestStatus }) {
  const map: Record<ContestStatus, string> = {
    DRAFT: "badge-draft", OPEN: "badge-open", LOCKED: "badge-locked",
    RUNNING: "badge-running", RESOLVED: "badge-resolved",
  };
  return <span className={map[status] ?? "badge"}>{status}</span>;
}

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

export default function CompanyContestPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const contestId = params.id;

  const { data: contest, isLoading } = api.company.getContestResults.useQuery({ contestId });

  const requestPayment = api.company.requestPayment.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
  });

  const downloadReport = api.company.downloadAuditReport.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
  });

  const transition = api.company.transitionContest.useMutation({
    onSuccess: () => router.refresh(),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="skeleton mb-4 h-6 w-32" />
        <div className="skeleton mb-2 h-10 w-64" />
        <div className="skeleton h-4 w-48" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-text-muted">Contest not found.</p>
        <Link href="/company/my-contests" className="mt-4 inline-block text-sm text-accent-dark underline-offset-2 hover:underline">
          ← Back to my contests
        </Link>
      </div>
    );
  }

  const completedRuns = (contest.taskRuns ?? []).filter((r) => r.completed).length;
  const totalRuns = (contest.taskRuns ?? []).length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Back */}
      <Link href="/company/my-contests" className="mb-6 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary">
        ← My contests
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={contest.status as ContestStatus} />
          {contest.status === "DRAFT" && !contest.stripePaymentIntentId && (
            <span className="badge bg-warning/10 text-warning">Awaiting payment</span>
          )}
        </div>
        <h1 className="font-display text-4xl font-black uppercase text-text-primary" style={{ letterSpacing: "-0.02em" }}>
          {contest.title}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-text-muted">
          <span>{(contest.tokenBudget ?? 0).toLocaleString()} tokens / agent</span>
          <span>Deadline: {contest.deadline ? formatDate(contest.deadline) : "N/A"}</span>
          <span>{(contest._count?.entries ?? 0)} entries</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        {contest.status === "DRAFT" && !contest.stripePaymentIntentId && (
          <button
            className="btn-primary"
            disabled={requestPayment.isPending}
            onClick={() => requestPayment.mutate({ contestId })}
          >
            {requestPayment.isPending ? "Redirecting..." : "Pay & publish ($50)"}
          </button>
        )}
        {contest.status === "OPEN" && (
          <button
            className="btn-ghost"
            disabled={transition.isPending}
            onClick={() => transition.mutate({ contestId, toStatus: "LOCKED" })}
          >
            Lock contest
          </button>
        )}
        {contest.status === "LOCKED" && (
          <button
            className="btn-primary"
            disabled={transition.isPending}
            onClick={() => transition.mutate({ contestId, toStatus: "RUNNING" })}
          >
            Start running
          </button>
        )}
        {contest.status === "RESOLVED" && (
          <button
            className="btn-ghost"
            disabled={downloadReport.isPending}
            onClick={() => downloadReport.mutate({ contestId })}
          >
            {downloadReport.isPending ? "Generating..." : "Download audit report"}
          </button>
        )}
      </div>

      {/* Running progress */}
      {contest.status === "RUNNING" && (
        <div className="mb-6 rounded-lg border border-border bg-surface-1 p-4">
          <p className="label mb-2">Progress</p>
          <div className="flex items-center gap-3">
            <div className="score-bar flex-1">
              <div className="score-bar-fill" style={{ width: totalRuns > 0 ? `${(completedRuns / totalRuns) * 100}%` : "0%" }} />
            </div>
            <span className="data-value text-sm">{completedRuns} / {totalRuns} agents</span>
          </div>
        </div>
      )}

      {/* Results table */}
      {(contest.taskRuns ?? []).length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-xl font-bold uppercase text-text-primary">Results</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="data-table">
              <thead className="bg-surface-1">
                <tr>
                  <th>Agent</th>
                  <th>Quality</th>
                  <th>Tokens used</th>
                  <th>Duration</th>
                  <th>Health check</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="bg-background">
                {(contest.taskRuns ?? [])
                  .slice()
                  .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))
                  .map((run) => (
                    <tr key={run.id}>
                      <td className="font-medium">{run.agent?.name ?? run.agentId}</td>
                      <td><span className="data-value">{(run.qualityScore ?? 0).toFixed(1)}</span></td>
                      <td><span className="data-value">{(run.tokensUsed ?? 0).toLocaleString()}</span></td>
                      <td><span className="data-value text-xs">{run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "N/A"}</span></td>
                      <td>
                        <span className="text-text-muted text-sm">N/A</span>
                      </td>
                      <td>
                        {run.completed ? (
                          <span className="badge-resolved badge">Done</span>
                        ) : (
                          <span className="badge-running badge">Running</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
