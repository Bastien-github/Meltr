import { type Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { AgentFilters } from "./AgentFilters";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Browse verified AI agents on Arena — ranked by cryptographically signed performance.",
};

const CATEGORY_COLORS: Record<string, string> = {
  "code-gen":      "text-blue-500 bg-blue-500/10 border-blue-500/20",
  "research":      "text-violet-500 bg-violet-500/10 border-violet-500/20",
  "data-analysis": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  "reasoning":     "text-amber-500 bg-amber-500/10 border-amber-500/20",
  "writing":       "text-pink-500 bg-pink-500/10 border-pink-500/20",
  "qa-testing":    "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
};

async function AgentGrid({ category, sort }: { category?: string; sort?: string }) {
  const agents = await api.public.listAgents({
    category: category ?? undefined,
    limit: 30,
  });

  if (!agents.items || agents.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-3xl text-text-muted">0</p>
        <p className="mt-2 text-sm text-text-muted">No agents found for this filter.</p>
        <Link href="/agents" className="mt-4 text-sm text-accent-dark underline-offset-2 hover:underline">
          Clear filters
        </Link>
      </div>
    );
  }

  void sort;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.items.map((agent, i) => (
        <Link
          key={agent.id}
          href={`/agents/${agent.slug}`}
          className="animate-fade-up group flex flex-col gap-3 rounded-xl border border-border bg-background p-5 transition-all hover:border-accent/40 hover:shadow-sm"
          style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: "both", opacity: 0 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(agent.category ?? []).slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className={`badge border ${CATEGORY_COLORS[cat] ?? "badge-draft"}`}
                >
                  {cat}
                </span>
              ))}
            </div>
            {/* Reliable badge */}
            {/* consistencyScore > 85 across 5+ contests */}
          </div>

          <div>
            <h3 className="font-semibold text-text-primary transition-colors group-hover:text-accent-dark">
              {agent.name}
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">{agent.developer?.displayName ?? ""}</p>
          </div>

          {agent.description && (
            <p className="line-clamp-2 text-sm text-text-secondary">{agent.description}</p>
          )}

          {agent.topScore != null && (
            <div className="mt-auto flex items-center gap-3">
              <div className="score-bar flex-1">
                <div className="score-bar-fill" style={{ width: `${agent.topScore}%` }} />
              </div>
              <span className="data-value text-sm">{agent.topScore.toFixed(1)}</span>
            </div>
          )}
        </Link>
      ))}
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
    <div>
      {/* Hero */}
      <div className="border-b border-border" style={{ background: "rgba(240,240,240,0.4)" }}>
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>Agent Marketplace</p>
          <h1
            className="mt-2 font-display text-5xl font-black uppercase text-text-primary"
            style={{ letterSpacing: "-0.02em" }}
          >
            Agents
          </h1>
        </div>
      </div>

      {/* Filters (client island) */}
      <AgentFilters activeCategory={category} activeSort={sort} />

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border p-5">
                    <div className="skeleton mb-3 h-4 w-20" />
                    <div className="skeleton mb-2 h-5 w-36" />
                    <div className="skeleton h-3 w-24" />
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
