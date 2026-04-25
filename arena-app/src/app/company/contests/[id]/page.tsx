"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { Badge } from "~/components/ui/Badge";
import { StatCard } from "~/components/ui/StatCard";

type ContestStatus = "DRAFT" | "OPEN" | "LOCKED" | "RUNNING" | "RESOLVED";

function StatusDot({ status }: { status: string }) {
  const color =
    status === "Completed" ? "#16a34a" :
    status === "Running" ? "#3b82f6" :
    "#dc2626";
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
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
    onSuccess: (data) => window.open(data.url, "_blank"),
  });

  const transition = api.company.transitionContest.useMutation({
    onSuccess: () => router.refresh(),
  });

  if (isLoading) {
    return (
      <div className="pt-12">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="skeleton mb-4 h-6 w-32" />
          <div className="skeleton mb-2 h-10 w-64" />
          <div className="skeleton h-4 w-48" />
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="pt-12">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-text-secondary">Contest not found.</p>
          <Link href="/company/my-contests" className="mt-4 inline-block text-sm text-accent-dark underline-offset-2 hover:underline">
            ← Back to my contests
          </Link>
        </div>
      </div>
    );
  }

  const completedRuns = (contest.taskRuns ?? []).filter((r) => r.completed).length;
  const totalRuns = (contest.taskRuns ?? []).length;
  const progressPct = totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0;

  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "My Contests", href: "/company/my-contests" }, { label: contest.title }]} />

      {/* Header */}
      <div className="border-b border-border bg-surface-1 px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-6">
          <div>
            <div className="mb-2.5 flex items-center gap-1.5">
              <Badge status={contest.status as ContestStatus} />
              {contest.status === "DRAFT" && !contest.stripePaymentIntentId && (
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
            <h1
              className="mb-2 font-display font-bold uppercase text-text-primary"
              style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", letterSpacing: "-0.01em" }}
            >
              {contest.title}
            </h1>
            <div className="text-xs text-text-secondary">
              {(contest.tokenBudget ?? 0) / 1000}k tokens/agent
              {contest.deadline && (
                <> · Deadline {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(contest.deadline))}</>
              )}
              {" · "}{contest._count?.entries ?? 0} entries
            </div>
          </div>

          {/* Running progress + actions */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            {contest.status === "RUNNING" && (
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#3b82f6",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  <span className="text-xs text-text-secondary">
                    {completedRuns} of {totalRuns} runs complete
                  </span>
                </div>
                <div className="w-44 overflow-hidden rounded" style={{ background: "#E8E8E8", height: 4 }}>
                  <div style={{ height: "100%", background: "#3b82f6", width: `${progressPct}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {contest.status === "DRAFT" && !contest.stripePaymentIntentId && (
                <button
                  className="btn-primary text-sm"
                  disabled={requestPayment.isPending}
                  onClick={() => requestPayment.mutate({ contestId })}
                >
                  {requestPayment.isPending ? "Redirecting…" : "Pay & publish ($50) →"}
                </button>
              )}
              {contest.status === "OPEN" && (
                <button
                  className="btn-ghost text-sm"
                  disabled={transition.isPending}
                  onClick={() => transition.mutate({ contestId, toStatus: "LOCKED" })}
                >
                  Lock contest
                </button>
              )}
              {contest.status === "LOCKED" && (
                <button
                  className="btn-primary text-sm"
                  disabled={transition.isPending}
                  onClick={() => transition.mutate({ contestId, toStatus: "RUNNING" })}
                >
                  Start running →
                </button>
              )}
              {contest.status === "RESOLVED" && (
                <button
                  className="btn-ghost text-sm"
                  disabled={downloadReport.isPending}
                  onClick={() => downloadReport.mutate({ contestId })}
                >
                  {downloadReport.isPending ? "Generating…" : "Download audit report"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats + run log */}
      <div className="mx-auto max-w-7xl px-6 py-6 pb-20">
        {/* 4-stat grid */}
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Token budget" value={(contest.tokenBudget ?? 0).toLocaleString()} mono />
          <StatCard
            label="Submission deadline"
            value={
              contest.deadline
                ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(contest.deadline))
                : "N/A"
            }
          />
          <StatCard label="Agents entered" value={contest._count?.entries ?? 0} />
          <StatCard label="Judge model" value={contest.judgeModelVersion ?? "N/A"} mono />
        </div>

        {/* Run log */}
        {(contest.taskRuns ?? []).length > 0 && (
          <div>
            <div className="label mb-4">Run Log</div>
            <div className="overflow-hidden rounded-xl border border-border">
              {/* Header */}
              <div
                className="grid bg-surface-1 px-4"
                style={{ gridTemplateColumns: "1.5fr 100px 80px 100px 80px 140px", borderBottom: "1px solid #E0E0E0" }}
              >
                {[
                  { label: "AGENT", align: "left" },
                  { label: "STATUS", align: "left" },
                  { label: "QUALITY", align: "right" },
                  { label: "TOKENS USED", align: "right" },
                  { label: "DURATION", align: "right" },
                  { label: "ORACLE HASH", align: "right" },
                ].map(({ label, align }) => (
                  <div key={label} className="label py-2.5" style={{ fontSize: "0.7rem", textAlign: align as "left" | "right" }}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {(contest.taskRuns ?? [])
                .slice()
                .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))
                .map((run, i) => {
                  const runStatus = run.completed ? "Completed" : run.startedAt ? "Running" : "Failed";
                  const hash = (run as { oracleResult?: { hash?: string } }).oracleResult?.hash;
                  const shortHash = hash ? hash.slice(0, 12) : null;

                  return (
                    <div
                      key={run.id}
                      className="grid bg-background px-4 py-3 transition-colors hover:bg-surface-1"
                      style={{ gridTemplateColumns: "1.5fr 100px 80px 100px 80px 140px", borderTop: i > 0 ? "1px solid #E0E0E0" : undefined }}
                    >
                      {/* Agent */}
                      <span className="text-sm font-medium text-text-primary">
                        {run.agent?.name ?? run.agentId}
                      </span>

                      {/* Status */}
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={runStatus} />
                        <span className="text-xs text-text-secondary">{runStatus}</span>
                      </div>

                      {/* Quality */}
                      <div className="flex items-center justify-end">
                        {run.qualityScore != null ? (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem" }}>
                            {run.qualityScore.toFixed(1)}
                          </span>
                        ) : (
                          <span style={{ color: "#CCC" }}>N/A</span>
                        )}
                      </div>

                      {/* Tokens */}
                      <div className="flex items-center justify-end">
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#888" }}>
                          {(run.tokensUsed ?? 0).toLocaleString()}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center justify-end">
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#888" }}>
                          {run.durationMs
                            ? `${Math.floor(run.durationMs / 60000)}m ${Math.floor((run.durationMs % 60000) / 1000)}s`
                            : "N/A"}
                        </span>
                      </div>

                      {/* Oracle hash */}
                      <div className="flex items-center justify-end">
                        {shortHash ? (
                          <span
                            title={hash}
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: "0.7rem",
                              color: "#888",
                              cursor: "default",
                              textDecoration: "underline dotted",
                            }}
                          >
                            {shortHash}…
                          </span>
                        ) : (
                          <span style={{ color: "#CCC" }}>N/A</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(contest.taskRuns ?? []).length === 0 && (
          <div className="py-16 text-center">
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "3rem", color: "#CCC" }}>0</div>
            <p className="mt-2 text-sm text-text-secondary">
              {contest.status === "DRAFT" || contest.status === "OPEN"
                ? "No runs yet. Contest is accepting entries."
                : "No runs to display."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
