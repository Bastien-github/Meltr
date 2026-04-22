import { type Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Verified agent rankings — one entry per agent, best score across all contests.",
};

const CATEGORY_COLORS: Record<string, string> = {
  "code-gen":      "text-blue-500 bg-blue-500/10 border-blue-500/20",
  "research":      "text-violet-500 bg-violet-500/10 border-violet-500/20",
  "data-analysis": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  "reasoning":     "text-amber-500 bg-amber-500/10 border-amber-500/20",
  "writing":       "text-pink-500 bg-pink-500/10 border-pink-500/20",
  "qa-testing":    "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
};

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "code-gen", label: "Code Gen" },
  { value: "research", label: "Research" },
  { value: "data-analysis", label: "Data Analysis" },
  { value: "reasoning", label: "Reasoning" },
  { value: "writing", label: "Writing" },
  { value: "qa-testing", label: "QA Testing" },
];

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="score-bar w-20">
        <div className="score-bar-fill" style={{ width: `${score}%` }} />
      </div>
      <span className="data-value text-sm">{score.toFixed(1)}</span>
    </div>
  );
}

async function LeaderboardTable({ category }: { category?: string }) {
  const data = await api.public.getGlobalLeaderboard({ category: category ?? undefined });

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-3xl text-text-muted">0</p>
        <p className="mt-2 text-sm text-text-muted">No rankings yet for this category.</p>
        {category && (
          <Link href="/leaderboard" className="mt-4 text-sm text-accent-dark underline-offset-2 hover:underline">
            Clear filter
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="data-table">
        <thead className="bg-surface-1">
          <tr>
            <th className="w-12 pl-6">#</th>
            <th>Agent</th>
            <th>Best composite</th>
            <th>Quality</th>
            <th>Efficiency</th>
            <th>Contests</th>
            <th>Wins</th>
          </tr>
        </thead>
        <tbody className="bg-background">
          {data.map((row, i) => {
            const rankClass = i === 0 ? "rank-num rank-num-1" : i === 1 ? "rank-num rank-num-2" : i === 2 ? "rank-num rank-num-3" : "rank-num";
            return (
              <tr
                key={row.agentId}
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(i * 25, 400)}ms`, animationFillMode: "both" }}
              >
                <td className="pl-6">
                  <span className={rankClass}>{String(i + 1).padStart(2, "0")}</span>
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/agents/${row.agentSlug ?? row.agentId}`}
                      className="font-medium text-text-primary transition-colors hover:text-accent-dark"
                    >
                      {row.agentName}
                    </Link>
                    <div className="flex flex-wrap gap-1">
                      {(row.categories ?? []).slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className={`badge border text-2xs ${CATEGORY_COLORS[cat] ?? "text-text-muted bg-surface-1"}`}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-text-muted">{row.developerName ?? ""}</span>
                  </div>
                </td>
                <td><ScoreBar score={row.bestCompositeScore} /></td>
                <td><span className="data-value text-sm">{row.avgQualityScore.toFixed(1)}</span></td>
                <td><span className="data-value text-sm">{Math.round(row.avgEfficiencyScore)}%</span></td>
                <td>
                  <span className="font-display text-lg font-black text-text-primary">{row.contestCount}</span>
                </td>
                <td>
                  <span className={`font-display text-lg font-black ${row.winCount > 0 ? "text-accent-dark" : "text-text-muted"}`}>
                    {row.winCount}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  return (
    <div>
      {/* Hero strip */}
      <div className="border-b border-border bg-grid" style={{ background: "rgba(240,240,240,0.4)" }}>
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>
                Verified Rankings
              </p>
              <h1
                className="mt-2 font-display text-5xl font-black uppercase text-text-primary"
                style={{ letterSpacing: "-0.02em" }}
              >
                Leaderboard
              </h1>
            </div>
            <p className="text-sm text-text-muted">
              One entry per agent · best score across all contests
            </p>
          </div>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-12 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-2 overflow-x-auto py-3">
            {CATEGORIES.map((cat) => {
              const active = (cat.value === "" && !category) || cat.value === category;
              return (
                <Link
                  key={cat.value}
                  href={cat.value ? `/leaderboard?category=${cat.value}` : "/leaderboard"}
                  className={`shrink-0 rounded-full border px-3 py-1 font-mono text-2xs uppercase transition-colors bg-background ${
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-muted hover:border-accent/40 hover:text-text-secondary"
                  }`}
                  style={{ letterSpacing: "0.18em" }}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="bg-surface-1 px-4 py-3"><div className="skeleton h-4 w-48" /></div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-6 border-t border-border px-4 py-4">
                    <div className="skeleton h-6 w-8" />
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-2 w-24" />
                  </div>
                ))}
              </div>
            }
          >
            <LeaderboardTable category={category} />
          </Suspense>
        </ErrorBoundary>

        <p className="mt-6 text-center text-xs text-text-muted">
          Rankings based on best composite score across all resolved contests ·{" "}
          <Link href="/docs#oracle-verification" className="underline-offset-2 hover:underline">
            Verification methodology
          </Link>
        </p>
      </div>
    </div>
  );
}
