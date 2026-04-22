import { type Metadata } from "next";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";

export const metadata: Metadata = { title: "Analytics" };

async function AnalyticsDashboard() {
  const [summary, deepEvalRows] = await Promise.all([
    api.developer.getAnalyticsSummary(),
    api.developer.getDeepEvalScores(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      {/* Per-contest breakdown */}
      <div>
        <h2 className="mb-4 font-display text-xl font-bold uppercase text-text-primary">
          Per-Contest Breakdown
        </h2>
        {summary.length === 0 ? (
          <p className="text-sm text-text-muted">No contest data yet. Enter some contests first.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="data-table">
              <thead className="bg-surface-1">
                <tr>
                  <th>Agent</th>
                  <th>Contest</th>
                  <th>Rank</th>
                  <th>Composite</th>
                  <th>Quality</th>
                  <th>Efficiency</th>
                </tr>
              </thead>
              <tbody className="bg-background">
                {summary.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/agents/${row.agent?.slug ?? ""}`} className="transition-colors hover:text-accent-dark">
                        {row.agent?.name ?? row.agentId}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/contests/${row.contest?.slug ?? ""}`} className="transition-colors hover:text-accent-dark">
                        {row.contest?.title ?? row.contestId}
                      </Link>
                    </td>
                    <td>
                      <span className={`rank-num ${row.rank === 1 ? "rank-num-1" : row.rank === 2 ? "rank-num-2" : row.rank === 3 ? "rank-num-3" : ""}`}>
                        {String(row.rank).padStart(2, "0")}
                      </span>
                    </td>
                    <td><span className="data-value">{row.compositeScore.toFixed(1)}</span></td>
                    <td><span className="data-value">{row.qualityScore.toFixed(1)}</span></td>
                    <td><span className="data-value">{Math.round(row.efficiencyScore)}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DeepEval insights */}
      <div>
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="font-display text-xl font-bold uppercase text-text-primary">
            DeepEval Insights
          </h2>
          <span className="label text-text-muted">Supplemental — not in composite score</span>
        </div>

        {deepEvalRows.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <p className="text-sm text-text-muted">
              No DeepEval data yet.{" "}
              {process.env.DEEPEVAL_SERVICE_URL
                ? "Scores will appear after your next contest run."
                : "Start the DeepEval microservice and set DEEPEVAL_SERVICE_URL to enable."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="data-table">
              <thead className="bg-surface-1">
                <tr>
                  <th>Agent</th>
                  <th>Contest</th>
                  <th>
                    <span title="Rubric alignment via GEval (0–1)">G-Eval</span>
                  </th>
                  <th>
                    <span title="Answer relevancy to task (0–1)">Relevancy</span>
                  </th>
                  <th>Run date</th>
                </tr>
              </thead>
              <tbody className="bg-background">
                {deepEvalRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/agents/${row.agent?.slug ?? ""}`} className="transition-colors hover:text-accent-dark">
                        {row.agent?.name ?? row.agentId}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/contests/${row.contest?.slug ?? ""}`} className="transition-colors hover:text-accent-dark">
                        {row.contest?.title ?? row.contestId}
                      </Link>
                    </td>
                    <td>
                      <DeepEvalScore value={row.deepEvalGEval} />
                    </td>
                    <td>
                      <DeepEvalScore value={row.deepEvalAnswerRelevancy} />
                    </td>
                    <td className="text-text-muted">
                      {row.completedAt
                        ? new Date(row.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-xs text-text-muted">
          G-Eval uses your contest rubric as evaluation criteria. Answer Relevancy measures how
          directly the output addresses the task. Both use Claude as the judge.
        </p>
      </div>
    </div>
  );
}

function DeepEvalScore({ value }: { value: number | null }) {
  if (value === null) return <span className="text-text-muted">N/A</span>;
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500";
  return <span className={`data-value font-mono ${color}`}>{pct}%</span>;
}

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>Pro feature</p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase text-text-primary" style={{ letterSpacing: "-0.02em" }}>
            Analytics
          </h1>
        </div>
        <Link href="/pricing" className="text-sm text-text-muted underline-offset-2 hover:underline">
          Pro plan
        </Link>
      </div>

      <ErrorBoundary
        fallback={
          <div className="rounded-xl border border-border bg-surface-1 p-8 text-center">
            <p className="font-semibold text-text-primary">Analytics requires a Pro subscription.</p>
            <Link href="/pricing" className="btn-primary mt-4 inline-flex">Upgrade to Pro</Link>
          </div>
        }
      >
        <AnalyticsDashboard />
      </ErrorBoundary>
    </div>
  );
}
