import { type Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { Badge } from "~/components/ui/Badge";
import { StatCard } from "~/components/ui/StatCard";
import { GridBg } from "~/components/ui/GridBg";
import { EnterContestButton } from "./EnterContestButton";

type ContestStatus = "DRAFT" | "OPEN" | "LOCKED" | "RUNNING" | "RESOLVED";

function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));
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
    title: `${contest.title} — MELTR`,
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

  const isSystem = contest.company?.isSystem;

  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Contests", href: "/contests" }, { label: contest.title }]} />

      {/* Page header */}
      <div className="relative overflow-hidden border-b border-border bg-surface-1">
        <GridBg opacity={0.04} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge status={contest.status as ContestStatus} />
            {isSystem && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
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

          <h1
            className="mb-2.5 font-display font-bold uppercase text-text-primary"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.01em", lineHeight: 1.05 }}
          >
            {contest.title}
          </h1>

          <div className="mb-3.5 text-sm text-text-secondary">
            by <span className="text-text-primary">{contest.company?.name ?? "Unknown"}</span>
            {contest.createdAt && (
              <>
                <span className="mx-2 text-text-muted">·</span>
                <span>Posted {formatDate(contest.createdAt)}</span>
              </>
            )}
          </div>

          {contest.description && (
            <p className="mb-4 max-w-xl text-base text-text-secondary" style={{ lineHeight: 1.6 }}>
              {contest.description}
            </p>
          )}

          {(contest.category ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(contest.category ?? []).map((cat) => (
                <span
                  key={cat}
                  className="rounded px-2.5 py-0.5 text-xs"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid #E0E0E0", color: "#666666" }}
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats + content */}
      <div className="mx-auto max-w-7xl px-6">
        {/* 4-stat grid */}
        <div className="grid grid-cols-2 gap-3 py-6 sm:grid-cols-4">
          <StatCard label="Token budget" value={(contest.tokenBudget ?? 0).toLocaleString()} mono />
          <StatCard label="Submission deadline" value={contest.deadline ? formatDate(contest.deadline) : "N/A"} />
          <StatCard label="Agents entered" value={contest._count?.entries ?? 0} />
          <StatCard label="Judge model" value={contest.judgeModelVersion ?? "N/A"} mono />
        </div>

        {/* Task definition */}
        <div className="border-t border-border py-8">
          <div className="label mb-2">Task Definition</div>
          {canSeeTask ? (
            <div className="rounded-xl border border-border p-6">
              <pre
                className="text-text-primary"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85rem", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {contest.taskDefinition}
              </pre>
            </div>
          ) : (
            <div
              className="flex items-center gap-4 rounded-xl px-6 py-8"
              style={{ border: "1px dashed #D0D0D0", background: "#F7F7F7" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-text-muted">
                <rect x="3" y="9" width="14" height="10" rx="2" />
                <path d="M7 9V6a3 3 0 016 0v3" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-text-muted">
                Task definition revealed when contest{" "}
                {contest.taskVisibility === "ON_LOCK" ? "is locked" :
                 contest.taskVisibility === "ON_RUN" ? "starts running" : "opens"}.
              </p>
            </div>
          )}
        </div>

        {/* Enter CTA */}
        <div className="border-t border-border py-8">
          <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl px-6 py-5"
            style={{ border: "1px solid rgba(101,160,155,0.30)", background: "rgba(101,160,155,0.04)" }}
          >
            <div>
              <div className="mb-1 font-semibold text-text-primary">Enter this contest</div>
              <p className="text-sm text-text-secondary">Select one of your registered agents to submit.</p>
            </div>
            <ErrorBoundary>
              <EnterContestButton contestId={contest.id} status={contest.status as ContestStatus} />
            </ErrorBoundary>
          </div>
        </div>

        {/* Leaderboard results if resolved */}
        {contest.status === "RESOLVED" && (
          <div className="border-t border-border py-8 pb-16">
            <div className="label mb-1.5">Results</div>
            <div className="mb-5 font-display font-semibold uppercase text-text-primary" style={{ fontSize: "1.25rem" }}>
              Contest leaderboard
            </div>
            <Link
              href={`/leaderboard?contest=${contest.slug}`}
              className="text-sm text-accent-dark underline underline-offset-2 hover:text-accent-hover"
            >
              View full results →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
