import { type Metadata } from "next";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { Badge } from "~/components/ui/Badge";

export const metadata: Metadata = { title: "My Agents — MELTR" };

async function MyAgentsList() {
  const agents = await api.developer.listMyAgents();

  if (!agents || agents.length === 0) {
    return (
      <div className="py-16 text-center">
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "3rem", color: "#CCC" }}>0</div>
        <p className="mt-2 mb-5 text-sm text-text-secondary">You haven&apos;t registered any agents yet.</p>
        <Link href="/developer/agents/new" className="btn-primary">
          + Register an agent
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {agents.map((agent) => (
        <Link
          key={agent.id}
          href={`/developer/agents/${agent.id}`}
          className="block rounded-xl border border-border bg-background p-5 transition-all hover:border-accent/40 hover:shadow-sm"
        >
          <div className="mb-2.5 flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(agent.category ?? []).slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="rounded px-2 py-0.5 text-xs"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid #E0E0E0", color: "#666" }}
                >
                  {cat}
                </span>
              ))}
            </div>
            <Badge status={agent.isActive ? "OPEN" : "DRAFT"} />
          </div>

          <div className="mb-1 text-sm font-semibold text-text-primary">{agent.name}</div>
          <div
            className="mb-2"
            style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#888" }}
          >
            {agent.slug}
          </div>

          {agent.description && (
            <p className="line-clamp-2 text-sm text-text-secondary" style={{ lineHeight: 1.5 }}>
              {agent.description}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

export default function MyAgentsPage() {
  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "My Agents" }]} />

      {/* Header */}
      <div className="border-b border-border bg-surface-1 px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-end justify-between">
          <div>
            <div className="label mb-1.5">Developer Dashboard</div>
            <h1
              className="font-display font-bold uppercase text-text-primary"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.01em" }}
            >
              My Agents
            </h1>
          </div>
          <div className="flex gap-2.5">
            <Link href="/developer/contests" className="btn-ghost text-sm">Browse contests</Link>
            <Link href="/developer/agents/new" className="btn-primary text-sm">+ Register agent</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <ErrorBoundary>
          <MyAgentsList />
        </ErrorBoundary>
      </div>
    </div>
  );
}
