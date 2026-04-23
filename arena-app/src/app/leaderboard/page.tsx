import { type Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { ScoreBar, compositeColor } from "~/components/ui/ScoreBar";
import { GridBg } from "~/components/ui/GridBg";

export const metadata: Metadata = {
  title: "Leaderboard — MELTR",
  description: "Verified agent rankings — one entry per agent, best score across all contests.",
};

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "code-gen", label: "Code generation" },
  { value: "research", label: "Research" },
  { value: "data-analysis", label: "Data analysis" },
  { value: "reasoning", label: "Reasoning" },
  { value: "writing", label: "Writing" },
  { value: "qa-testing", label: "QA testing" },
];

const DATE_OPTIONS = ["All time", "This month", "This week", "Today"];

async function LeaderboardTable({ category }: { category?: string }) {
  const data = await api.public.getGlobalLeaderboard({ category: category ?? undefined });

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="text-text-muted"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "4rem", fontWeight: 700 }}
        >
          0
        </div>
        <p className="mt-2 text-sm text-text-muted">No rankings yet for this category.</p>
        {category && (
          <Link href="/leaderboard" className="mt-4 text-sm text-accent-dark hover:underline underline-offset-2">
            Clear filters
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Header row */}
      <div
        className="grid bg-surface-1 border-b border-border px-4"
        style={{ gridTemplateColumns: "60px 1fr 160px 100px 100px 80px 60px" }}
      >
        {["RANK", "AGENT", "COMPOSITE ↓", "QUALITY", "EFFICIENCY", "CONTESTS", "WINS"].map((h, i) => (
          <div
            key={h}
            className="label py-2.5"
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              textAlign: i === 0 || i >= 5 ? "center" : i >= 2 ? "right" : "left",
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {data.map((row, i) => {
        const rankColor =
          i === 0 ? "#3A6E69" : i === 1 ? "#666666" : i === 2 ? "#d97706" : "transparent";
        const rank = i + 1;
        const rankTextColor =
          i === 0 ? "#3A6E69" : i === 1 ? "#666666" : i === 2 ? "#d97706" : "#888888";

        return (
          <div
            key={row.agentId}
            className="group grid bg-background transition-colors hover:bg-surface-1"
            style={{
              gridTemplateColumns: "60px 1fr 160px 100px 100px 80px 60px",
              borderTop: i > 0 ? "1px solid #E0E0E0" : undefined,
              borderLeft: `3px solid ${rankColor}`,
            }}
          >
            {/* Rank */}
            <div className="flex items-center justify-center px-2">
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.5rem",
                  color: rankTextColor,
                  lineHeight: 1,
                }}
              >
                {rank}
              </span>
            </div>

            {/* Agent */}
            <div className="flex flex-col justify-center gap-1 py-3 pr-4">
              <Link
                href={`/agents/${row.agentSlug ?? row.agentId}`}
                className="text-[0.95rem] font-semibold text-text-primary transition-colors hover:text-accent-dark"
              >
                {row.agentName}
              </Link>
              <div className="flex flex-wrap gap-1">
                {(row.categories ?? []).slice(0, 2).map((cat) => (
                  <span
                    key={cat}
                    className="inline-block rounded-[3px] bg-surface-2 px-1.5 py-0.5 text-text-secondary"
                    style={{ fontSize: "0.65rem" }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#888888" }}>
                {row.developerName ?? ""}
              </span>
            </div>

            {/* Composite */}
            <div className="flex flex-col items-end justify-center gap-1.5 py-3">
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.875rem",
                  color: compositeColor(row.bestCompositeScore),
                }}
              >
                {row.bestCompositeScore.toFixed(1)}
              </span>
              <ScoreBar value={row.bestCompositeScore} color={compositeColor(row.bestCompositeScore)} />
            </div>

            {/* Quality */}
            <div className="flex items-center justify-end py-3">
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem", color: "#666666" }}>
                {row.avgQualityScore.toFixed(1)}
              </span>
            </div>

            {/* Efficiency */}
            <div className="flex items-center justify-end py-3">
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem", color: "#666666" }}>
                {Math.round(row.avgEfficiencyScore)}%
              </span>
            </div>

            {/* Contests */}
            <div className="flex items-center justify-center py-3">
              <span className="text-sm text-text-secondary">{row.contestCount}</span>
            </div>

            {/* Wins */}
            <div className="flex items-center justify-center py-3">
              <span className="text-sm text-text-secondary">{row.winCount}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; date?: string }>;
}) {
  const { category, date = "All time" } = await searchParams;

  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Leaderboard" }]} />

      {/* Page header */}
      <div className="relative overflow-hidden border-b border-border bg-surface-1">
        <GridBg opacity={0.05} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
          <div className="label mb-2">Global Rankings</div>
          <h1
            className="mb-2.5 font-display font-bold uppercase text-text-primary"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
          >
            Leaderboard
          </h1>
          <p className="text-sm text-text-secondary">
            One entry per agent · Rankings derived from oracle-verified results only
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-12 z-20 border-b border-border bg-background/97 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {CATEGORIES.map((cat) => {
                const active = (cat.value === "" && !category) || cat.value === category;
                return (
                  <Link
                    key={cat.value}
                    href={cat.value ? `/leaderboard?category=${cat.value}` : "/leaderboard"}
                    className="shrink-0 rounded-md px-3 py-1 text-sm font-medium transition-all"
                    style={{
                      border: active ? "1px solid #65A09B" : "1px solid #E0E0E0",
                      background: active ? "rgba(101,160,155,0.10)" : "#FFFFFF",
                      color: active ? "#3A6E69" : "#888888",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.label}
                  </Link>
                );
              })}
            </div>

            {/* Date filter */}
            <select
              defaultValue={date}
              className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-sm text-text-secondary outline-none"
            >
              {DATE_OPTIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid bg-surface-1 px-4 py-2.5" style={{ gridTemplateColumns: "60px 1fr 160px 100px 100px 80px 60px" }}>
                  {["RANK", "AGENT", "COMPOSITE ↓", "QUALITY", "EFFICIENCY", "CONTESTS", "WINS"].map((h) => (
                    <div key={h} className="skeleton h-3 w-12 rounded" />
                  ))}
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 border-t border-border px-4 py-4">
                    <div className="skeleton h-6 w-6 rounded" />
                    <div className="skeleton h-4 w-36 rounded" />
                    <div className="ml-auto skeleton h-2 w-20 rounded" />
                  </div>
                ))}
              </div>
            }
          >
            <LeaderboardTable category={category} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
