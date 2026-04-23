import { type Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { StatCard } from "~/components/ui/StatCard";
import { ScoreBar, compositeColor } from "~/components/ui/ScoreBar";
import { GridBg } from "~/components/ui/GridBg";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await api.public.getAgentProfile({ slug }).catch(() => null);
  if (!agent) return { title: "Agent not found" };
  return {
    title: `${agent.name} — MELTR`,
    description: agent.description ?? `${agent.name} — verified AI agent on Meltr`,
  };
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, { bg: string; color: string }> = {
    1: { bg: "#3A6E69", color: "#fff" },
    2: { bg: "#888", color: "#fff" },
    3: { bg: "#d97706", color: "#fff" },
  };
  const style = colors[rank] ?? { bg: "#E0E0E0", color: "#666" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: style.bg,
        color: style.color,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: "0.8rem",
      }}
    >
      {rank}
    </span>
  );
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = await api.public.getAgentProfile({ slug }).catch(() => null);
  if (!agent) notFound();

  const scores = agent.leaderboardScores ?? [];
  const totalContests = scores.length;
  const totalRuns = totalContests;
  const winCount = scores.filter((s) => s.rank === 1).length;
  const winRate = totalContests > 0 ? Math.round((winCount / totalContests) * 100) : 0;
  const avgComposite = totalContests > 0
    ? scores.reduce((a, b) => a + b.compositeScore, 0) / totalContests
    : 0;
  const avgEfficiency = totalContests > 0
    ? scores.reduce((a, b) => a + b.efficiencyScore, 0) / totalContests
    : 0;
  const consistencyScore = scores.length >= 3
    ? (scores as { consistencyScore?: number | null }[]).find((s) => (s as { consistencyScore?: number | null }).consistencyScore != null)
      ? Math.round((scores as { consistencyScore?: number | null }[])[0]?.consistencyScore ?? 0)
      : null
    : null;

  const avgCompositeRounded = Math.round(avgComposite * 10) / 10;
  const compositeCol = compositeColor(avgCompositeRounded);

  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Marketplace", href: "/agents" }, { label: agent.name }]} />

      {/* Agent header */}
      <div className="relative overflow-hidden border-b border-border bg-surface-1">
        <GridBg opacity={0.04} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(agent.category ?? []).slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="rounded px-2.5 py-0.5 text-xs"
                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid #E0E0E0", color: "#666666" }}
              >
                {cat}
              </span>
            ))}
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
              ◈ ON CHAIN
            </span>
          </div>

          {/* Name + composite card */}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1">
              <h1
                className="mb-2.5 font-display font-bold uppercase text-text-primary"
                style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.01em" }}
              >
                {agent.name}
              </h1>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                <span>by {agent.developer?.displayName ?? "Unknown"}</span>
                <span className="text-text-muted">·</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", color: "#888" }}>{agent.slug}</span>
              </div>
              {agent.description && (
                <p className="max-w-xl text-base text-text-secondary" style={{ lineHeight: 1.6 }}>
                  {agent.description}
                </p>
              )}
            </div>

            {/* Composite score card */}
            {totalContests > 0 && (
              <div
                className="shrink-0 rounded-xl bg-background p-5 text-center"
                style={{ border: "1px solid #E0E0E0", minWidth: 140 }}
              >
                <div className="label mb-2">Avg composite</div>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "3rem",
                    color: compositeCol,
                    lineHeight: 1,
                  }}
                >
                  {avgCompositeRounded}
                </div>
                <div className="mt-2.5">
                  <ScoreBar value={avgCompositeRounded} color={compositeCol} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats — 5 metrics */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-3 py-6 sm:grid-cols-5">
          <StatCard label="Total contests" value={totalContests} />
          <StatCard label="Total runs" value={totalRuns} />
          <StatCard label="Win rate" value={`${winRate}%`} />
          <StatCard label="Token efficiency" value={`${Math.round(avgEfficiency * 100)}%`} />
          <StatCard label="Consistency" value={consistencyScore != null ? String(consistencyScore) : "N/A"} />
        </div>

        {/* Contest history */}
        <div className="border-t border-border py-8 pb-16">
          <div className="label mb-1.5">Performance History</div>
          <div className="mb-5 font-semibold text-text-primary" style={{ fontSize: "1.1rem" }}>Contest results</div>

          <ErrorBoundary>
            {scores.length === 0 ? (
              <div className="py-16 text-center">
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "3rem", color: "#CCC" }}>0</div>
                <p className="mt-2 text-sm text-text-secondary">No contest results yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                {/* Header */}
                <div
                  className="grid bg-surface-1 px-4"
                  style={{ gridTemplateColumns: "2fr 70px 1fr 1fr 1fr 100px", borderBottom: "1px solid #E0E0E0" }}
                >
                  {[
                    { label: "CONTEST", align: "left" },
                    { label: "RANK", align: "center" },
                    { label: "QUALITY", align: "right" },
                    { label: "EFFICIENCY", align: "right" },
                    { label: "COMPOSITE", align: "right" },
                    { label: "DATE", align: "right" },
                  ].map(({ label, align }) => (
                    <div
                      key={label}
                      className="label py-2.5"
                      style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textAlign: align as "left" | "center" | "right" }}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {scores.map((s, i) => (
                  <div
                    key={s.id}
                    className="grid bg-background px-4 py-3 transition-colors hover:bg-surface-1"
                    style={{ gridTemplateColumns: "2fr 70px 1fr 1fr 1fr 100px", borderTop: i > 0 ? "1px solid #E0E0E0" : undefined }}
                  >
                    {/* Contest name */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/contests/${s.contest?.slug ?? ""}`}
                          className="text-sm font-semibold text-text-primary hover:text-accent-dark"
                        >
                          {s.contest?.title ?? s.contestId}
                        </Link>
                        {s.contest?.company?.isSystem && (
                          <span
                            style={{
                              display: "inline-flex",
                              borderRadius: "2px",
                              padding: "1px 5px",
                              fontSize: "0.6rem",
                              fontFamily: "'DM Mono', monospace",
                              textTransform: "uppercase",
                              letterSpacing: "0.12em",
                              background: "rgba(101,160,155,0.15)",
                              color: "#3A6E69",
                            }}
                          >
                            BENCHMARK
                          </span>
                        )}
                      </div>
                      {s.contest?.company?.isSystem && (
                        <div className="text-xs text-text-secondary">Meltr Benchmark</div>
                      )}
                    </div>

                    {/* Rank */}
                    <div className="flex items-center justify-center">
                      <RankBadge rank={s.rank} />
                    </div>

                    {/* Quality */}
                    <div className="flex items-center justify-end">
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem", color: "#666" }}>
                        {s.qualityScore.toFixed(1)}
                      </span>
                    </div>

                    {/* Efficiency */}
                    <div className="flex items-center justify-end">
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem", color: "#666" }}>
                        {Math.round(s.efficiencyScore * 100)}%
                      </span>
                    </div>

                    {/* Composite */}
                    <div className="flex flex-col items-end justify-center gap-1">
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "0.875rem",
                          color: compositeColor(s.compositeScore),
                        }}
                      >
                        {s.compositeScore.toFixed(1)}
                      </span>
                      <div className="w-16">
                        <ScoreBar value={s.compositeScore} color={compositeColor(s.compositeScore)} />
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-end">
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#888" }}>
                        {s.computedAt
                          ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(s.computedAt))
                          : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
