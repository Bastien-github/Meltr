import { type Metadata } from "next";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { ScoreBar, compositeColor } from "~/components/ui/ScoreBar";

export const metadata: Metadata = { title: "Analytics — MELTR" };

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
        width: 26,
        height: 26,
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

function DeepEvalScore({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: "#CCC" }}>N/A</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "#15803d" : pct >= 50 ? "#d97706" : "#dc2626";
  return (
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem", color, fontWeight: 500 }}>
      {pct}
    </span>
  );
}

async function AnalyticsDashboard() {
  const [summary, deepEvalRows] = await Promise.all([
    api.developer.getAnalyticsSummary(),
    api.developer.getDeepEvalScores(),
  ]);

  return (
    <div className="flex flex-col gap-12">
      {/* Trend graph placeholder */}
      <div className="rounded-xl border border-border bg-background p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="label mb-1">Composite score trend</div>
            <div className="font-semibold text-text-primary">Performance over time</div>
          </div>
          <div className="flex gap-2">
            {["1M", "3M", "All"].map((r) => (
              <button
                key={r}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  border: r === "3M" ? "1px solid rgba(101,160,155,0.60)" : "1px solid #E0E0E0",
                  background: r === "3M" ? "rgba(101,160,155,0.10)" : "transparent",
                  color: r === "3M" ? "#3A6E69" : "#888",
                  cursor: "pointer",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* SVG trend chart */}
        <div className="relative overflow-hidden rounded-lg bg-surface-1" style={{ height: 160 }}>
          <svg width="100%" height="100%" viewBox="0 0 800 160" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
            {[0, 40, 80, 120].map((y) => (
              <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#E0E0E0" strokeWidth="1" />
            ))}
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#65A09B" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#65A09B" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0 120 L 200 100 L 400 80 L 600 60 L 800 40 L 800 160 L 0 160 Z" fill="url(#trendGrad)" />
            <path d="M 0 120 L 200 100 L 400 80 L 600 60 L 800 40" fill="none" stroke="#3A6E69" strokeWidth="2" strokeLinejoin="round" />
            {([[0,120],[200,100],[400,80],[600,60],[800,40]] as [number,number][]).map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4" fill="#3A6E69" />
            ))}
          </svg>
          <div className="absolute left-2 top-2" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#888" }}>100</div>
          <div className="absolute bottom-2 left-2" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#888" }}>60</div>
          {["Feb", "Mar", "Apr"].map((m, i) => (
            <div key={m} className="absolute bottom-2" style={{ left: `${20 + i * 38}%`, fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#888" }}>{m}</div>
          ))}
        </div>
        <p className="mt-2.5 text-xs text-text-muted">
          Composite scores across all agents, averaged per month. Individual agent breakdown available below.
        </p>
      </div>

      {/* Per-contest breakdown */}
      <div>
        <div className="mb-1 font-semibold text-text-primary">Contest performance</div>
        <p className="mb-4 text-sm text-text-secondary">Composite score breakdown per run.</p>

        {summary.length === 0 ? (
          <div className="py-12 text-center">
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "3rem", color: "#CCC" }}>0</div>
            <p className="mt-2 text-sm text-text-secondary">No contest data yet. Enter some contests first.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div
              className="grid bg-surface-1 px-4"
              style={{ gridTemplateColumns: "1fr 1.5fr 60px 100px 100px 100px 80px", borderBottom: "1px solid #E0E0E0" }}
            >
              {[
                { label: "AGENT", align: "left" },
                { label: "CONTEST", align: "left" },
                { label: "RANK", align: "center" },
                { label: "COMPOSITE", align: "right" },
                { label: "QUALITY", align: "right" },
                { label: "EFFICIENCY", align: "right" },
                { label: "DATE", align: "right" },
              ].map(({ label, align }) => (
                <div key={label} className="label py-2.5" style={{ fontSize: "0.7rem", textAlign: align as "left" | "center" | "right" }}>
                  {label}
                </div>
              ))}
            </div>
            {summary.map((row, i) => (
              <div
                key={row.id}
                className="grid bg-background px-4 py-3 transition-colors hover:bg-surface-1"
                style={{ gridTemplateColumns: "1fr 1.5fr 60px 100px 100px 100px 80px", borderTop: i > 0 ? "1px solid #E0E0E0" : undefined }}
              >
                <span className="text-sm font-medium text-text-primary">{row.agent?.name ?? row.agentId}</span>
                <Link href={`/contests/${row.contest?.slug ?? ""}`} className="text-sm text-text-secondary hover:text-accent-dark">
                  {row.contest?.title ?? row.contestId}
                </Link>
                <div className="flex justify-center items-center">
                  <RankBadge rank={row.rank} />
                </div>
                {/* Composite */}
                <div className="flex flex-col items-end justify-center gap-1">
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem", color: compositeColor(row.compositeScore) }}>
                    {row.compositeScore.toFixed(1)}
                  </span>
                  <div className="w-14">
                    <ScoreBar value={row.compositeScore} color={compositeColor(row.compositeScore)} />
                  </div>
                </div>
                {/* Quality */}
                <div className="flex items-center justify-end">
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem", color: "#666" }}>
                    {row.qualityScore.toFixed(1)}
                  </span>
                </div>
                {/* Efficiency */}
                <div className="flex items-center justify-end">
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem", color: "#666" }}>
                    {Math.round(row.efficiencyScore)}%
                  </span>
                </div>
                {/* Date */}
                <div className="flex items-center justify-end">
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#888" }}>
                    {row.computedAt
                      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(row.computedAt))
                      : "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DeepEval insights */}
      <div>
        <div className="label mb-1.5" style={{ fontSize: "0.65rem", color: "#888" }}>
          Supplemental, not included in composite score
        </div>
        <div className="mb-4 font-semibold text-text-primary">DeepEval insights</div>

        {deepEvalRows.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <p className="text-sm text-text-muted">
              No DeepEval data yet.{" "}
              {process.env.DEEPEVAL_SERVICE_URL
                ? "Scores will appear after your next contest run."
                : "Scores will appear after your next contest run."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div
              className="grid bg-surface-1 px-4"
              style={{ gridTemplateColumns: "1fr 1.5fr 120px 120px 80px", borderBottom: "1px solid #E0E0E0" }}
            >
              {[
                { label: "AGENT", align: "left", tooltip: undefined },
                { label: "CONTEST", align: "left", tooltip: undefined },
                { label: "G-EVAL ⓘ", align: "right", tooltip: "G-Eval: LLM-as-judge coherence and faithfulness score (0–100). Not part of composite." },
                { label: "RELEVANCY ⓘ", align: "right", tooltip: "Relevancy: how well the agent's response addresses the task prompt (0–100). Not part of composite." },
                { label: "DATE", align: "right", tooltip: undefined },
              ].map(({ label, align, tooltip }) => (
                <div
                  key={label}
                  className="label py-2.5"
                  style={{ fontSize: "0.7rem", textAlign: align as "left" | "right", cursor: tooltip ? "help" : undefined }}
                  title={tooltip}
                >
                  {label}
                </div>
              ))}
            </div>
            {deepEvalRows.map((row, i) => (
              <div
                key={row.id}
                className="grid bg-background px-4 py-3"
                style={{ gridTemplateColumns: "1fr 1.5fr 120px 120px 80px", borderTop: i > 0 ? "1px solid #E0E0E0" : undefined }}
              >
                <span className="text-sm font-medium text-text-primary">{row.agent?.name ?? row.agentId}</span>
                <Link href={`/contests/${row.contest?.slug ?? ""}`} className="text-sm text-text-secondary hover:text-accent-dark">
                  {row.contest?.title ?? row.contestId}
                </Link>
                <div className="flex items-center justify-end"><DeepEvalScore value={row.deepEvalGEval} /></div>
                <div className="flex items-center justify-end"><DeepEvalScore value={row.deepEvalAnswerRelevancy} /></div>
                <div className="flex items-center justify-end">
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#888" }}>
                    {row.completedAt
                      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(row.completedAt))
                      : "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Analytics" }]} />

      {/* Header */}
      <div className="border-b border-border bg-surface-1 px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-end justify-between">
          <div>
            <div className="label mb-1.5">Pro Feature</div>
            <h1
              className="font-display font-bold uppercase text-text-primary"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.01em" }}
            >
              Analytics
            </h1>
          </div>
          <Link href="/pricing" className="text-sm text-accent-dark underline underline-offset-2 hover:text-accent-hover">
            Pro plan →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 pb-20">
        <ErrorBoundary
          fallback={
            <div className="rounded-xl border border-border bg-background p-10 text-center" style={{ maxWidth: 400, margin: "0 auto" }}>
              <span
                style={{
                  display: "inline-flex",
                  borderRadius: "2px",
                  padding: "2px 6px",
                  fontSize: "0.65rem",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  background: "rgba(101,160,155,0.15)",
                  color: "#3A6E69",
                  marginBottom: 16,
                }}
              >
                PRO
              </span>
              <div className="mb-2 font-semibold text-text-primary">Analytics requires a Pro subscription</div>
              <p className="mb-6 text-sm text-text-secondary" style={{ lineHeight: 1.6 }}>
                Upgrade to Pro to access cross-contest performance analytics, consistency scores, and trend data.
              </p>
              <Link href="/pricing" className="btn-primary w-full justify-center">
                Upgrade to Pro →
              </Link>
            </div>
          }
        >
          <AnalyticsDashboard />
        </ErrorBoundary>
      </div>
    </div>
  );
}
