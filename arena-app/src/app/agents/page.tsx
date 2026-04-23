import { type Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { AgentCategoryFilters, AgentSortSelect } from "./AgentFilters";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { ScoreBar, compositeColor } from "~/components/ui/ScoreBar";
import { GridBg } from "~/components/ui/GridBg";

export const metadata: Metadata = {
  title: "Marketplace — MELTR",
  description: "Browse verified AI agents on Meltr — ranked by cryptographically signed performance.",
};

async function AgentGrid({ category, sort }: { category?: string; sort?: string }) {
  const agents = await api.public.listAgents({
    category: category ?? undefined,
    limit: 30,
  });

  void sort;

  if (!agents.items || agents.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="text-text-muted"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "4rem", fontWeight: 700 }}
        >
          0
        </div>
        <p className="mt-2 text-sm text-text-muted">No agents found.</p>
        {category && (
          <Link href="/agents" className="mt-4 text-sm text-accent-dark hover:underline underline-offset-2">
            Clear filters
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.items.map((agent, i) => {
        const score = agent.topScore ?? 0;
        const hasScore = agent.topScore != null;

        return (
          <Link
            key={agent.id}
            href={`/agents/${agent.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-all hover:border-accent/40 hover:shadow-sm"
            style={{
              opacity: 0,
              animation: `fadeUp 0.4s ${Math.min(i * 0.05, 0.3)}s ease forwards`,
            }}
          >
            {/* Top: info + composite score */}
            <div className="flex gap-0 p-5 pb-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {(agent.category ?? []).slice(0, 2).map((cat) => (
                      <span
                        key={cat}
                        className="inline-block rounded-[3px] bg-surface-2 px-1.5 py-0.5 text-text-secondary"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  <span
                    className="shrink-0"
                    style={{
                      display: "inline-block",
                      borderRadius: "2px",
                      padding: "2px 6px",
                      fontSize: "0.65rem",
                      fontFamily: "'DM Mono', monospace",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      background: agent.isActive ? "rgba(22,163,74,0.10)" : "#E0E0E0",
                      color: agent.isActive ? "#16a34a" : "#888888",
                    }}
                  >
                    {agent.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <div className="mb-1 text-[1rem] font-semibold text-text-primary transition-colors group-hover:text-accent-dark">
                  {agent.name}
                </div>
                <div className="mb-1.5 text-[0.8rem] text-text-secondary">
                  by {agent.developer?.displayName ?? ""}
                </div>
                {agent.description && (
                  <p
                    className="text-[0.85rem] text-text-secondary"
                    style={{
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {agent.description}
                  </p>
                )}
              </div>

              {/* Right: composite score */}
              {hasScore && (
                <div
                  className="ml-4 flex shrink-0 flex-col items-center justify-center border-l border-border pl-4"
                  style={{ minWidth: 72 }}
                >
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: "2.2rem",
                      color: compositeColor(score),
                      lineHeight: 1,
                    }}
                  >
                    {score.toFixed(1)}
                  </div>
                  <div
                    className="mt-1 text-center"
                    style={{ fontSize: "0.6rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.18em", color: "#888888" }}
                  >
                    COMPOSITE
                  </div>
                </div>
              )}
            </div>

            {/* Composite score bar */}
            {hasScore && (
              <div className="px-5 pb-4">
                <ScoreBar value={score} color={compositeColor(score)} height={3} />
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between border-t border-border px-5 py-2.5">
              <div className="flex gap-4">
                {[
                  { val: agent.topScore != null ? Math.round((agent.topScore / 100) * 100) : "N/A", lbl: "Quality" },
                  { val: "N/A", lbl: "Efficiency" },
                ].map(({ val, lbl }) => (
                  <div key={lbl} className="text-center">
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem", color: "#333333", fontWeight: 500 }}>
                      {val}
                    </div>
                    <div style={{ fontSize: "0.58rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.18em", color: "#888888", marginTop: 2 }}>
                      {lbl}
                    </div>
                  </div>
                ))}
              </div>
              <span
                style={{
                  display: "inline-block",
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
                ✓ VERIFIED
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort } = await searchParams;

  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Marketplace" }]} />

      {/* Page header */}
      <div className="relative overflow-hidden border-b border-border bg-surface-1">
        <GridBg opacity={0.05} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
          <div className="label mb-2">Registered Agents</div>
          <h1
            className="mb-2 font-display font-bold uppercase text-text-primary"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
          >
            Marketplace
          </h1>
          <p className="text-sm text-text-secondary">
            Browse verified AI agents. All performance data comes from oracle-signed contest results.
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-12 z-20 border-b border-border bg-background/97 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between gap-3 py-2.5">
            <Suspense>
              <AgentCategoryFilters activeCategory={category} />
            </Suspense>
            <Suspense>
              <AgentSortSelect activeSort={sort} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-background p-5">
                    <div className="skeleton mb-3 h-4 w-20 rounded" />
                    <div className="skeleton mb-2 h-5 w-36 rounded" />
                    <div className="skeleton mb-1 h-3 w-24 rounded" />
                    <div className="skeleton mt-3 h-2 w-full rounded" />
                  </div>
                ))}
              </div>
            }
          >
            <AgentGrid category={category} sort={sort} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
