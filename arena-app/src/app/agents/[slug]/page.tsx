import { type Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";

const CATEGORY_COLORS: Record<string, string> = {
  "code-gen":      "text-blue-500 bg-blue-500/10 border-blue-500/20",
  "research":      "text-violet-500 bg-violet-500/10 border-violet-500/20",
  "data-analysis": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  "reasoning":     "text-amber-500 bg-amber-500/10 border-amber-500/20",
  "writing":       "text-pink-500 bg-pink-500/10 border-pink-500/20",
  "qa-testing":    "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await api.public.getAgentProfile({ slug }).catch(() => null);
  if (!agent) return { title: "Agent not found" };
  return {
    title: agent.name,
    description: agent.description ?? `${agent.name} — verified AI agent on Arena`,
  };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <p className="label">{label}</p>
      <p className="mt-1 font-display text-2xl font-black text-text-primary">
        {typeof value === "number" ? value.toFixed(1) : value}
      </p>
    </div>
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
  const winCount = scores.filter((s) => s.rank === 1).length;
  const winRate = totalContests > 0 ? Math.round((winCount / totalContests) * 100) : 0;
  const avgComposite = totalContests > 0
    ? scores.reduce((a, b) => a + b.compositeScore, 0) / totalContests
    : 0;
  const avgEfficiency = totalContests > 0
    ? scores.reduce((a, b) => a + b.efficiencyScore, 0) / totalContests
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/agents" className="transition-colors hover:text-text-secondary">Agents</Link>
        <span>/</span>
        <span className="text-text-primary">{agent.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(agent.category ?? []).slice(0, 3).map((cat) => (
            <span key={cat} className={`badge border ${CATEGORY_COLORS[cat] ?? "badge-draft"}`}>
              {cat}
            </span>
          ))}
          <span className="badge bg-surface-2 text-text-muted">On-chain identity: Pending</span>
        </div>

        <h1 className="font-display text-4xl font-black uppercase text-text-primary" style={{ letterSpacing: "-0.02em" }}>
          {agent.name}
        </h1>

        <p className="text-sm text-text-muted">
          by <span className="text-text-secondary">{agent.developer?.displayName ?? "Unknown"}</span>
          {" · "}
          <span className="font-mono text-xs">{agent.slug}</span>
        </p>

        {agent.description && (
          <p className="text-base text-text-secondary">{agent.description}</p>
        )}
      </div>

      <div className="divider my-6" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total contests" value={totalContests} />
        <StatCard label="Win rate" value={`${winRate}%`} />
        <StatCard label="Avg composite" value={avgComposite} />
        <StatCard label="Avg efficiency" value={`${Math.round(avgEfficiency)}%`} />
      </div>

      <div className="divider my-6" />

      {/* Contest history */}
      <div>
        <h2 className="mb-4 font-display text-xl font-bold uppercase text-text-primary">Contest History</h2>
        <ErrorBoundary>
          {scores.length === 0 ? (
            <p className="text-sm text-text-muted">No contests yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="data-table">
                <thead className="bg-surface-1">
                  <tr>
                    <th>Contest</th>
                    <th>Rank</th>
                    <th>Quality</th>
                    <th>Efficiency</th>
                    <th>Composite</th>
                  </tr>
                </thead>
                <tbody className="bg-background">
                  {scores.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/contests/${s.contest?.slug ?? ""}`}
                            className="transition-colors hover:text-accent-dark"
                          >
                            {s.contest?.title ?? s.contestId}
                          </Link>
                          {s.contest?.company?.isSystem && (
                            <span className="badge bg-accent/10 text-accent-dark">Benchmark</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`rank-num ${s.rank === 1 ? "rank-num-1" : s.rank === 2 ? "rank-num-2" : s.rank === 3 ? "rank-num-3" : ""}`}>
                          {String(s.rank).padStart(2, "0")}
                        </span>
                      </td>
                      <td><span className="data-value">{s.qualityScore.toFixed(1)}</span></td>
                      <td><span className="data-value">{Math.round(s.efficiencyScore)}%</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="score-bar w-16">
                            <div className="score-bar-fill" style={{ width: `${s.compositeScore}%` }} />
                          </div>
                          <span className="data-value text-sm">{s.compositeScore.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
