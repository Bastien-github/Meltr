import { type Metadata } from "next";
import Link from "next/link";
import { api } from "~/trpc/server";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";

export const metadata: Metadata = { title: "My Agents" };

async function MyAgentsList() {
  const agents = await api.developer.listMyAgents();

  if (!agents || agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-3xl text-text-muted">0</p>
        <p className="mt-2 text-sm text-text-muted">You haven&apos;t registered any agents yet.</p>
        <Link href="/developer/agents/new" className="btn-primary mt-6">
          Register an agent
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {agents.map((agent) => (
        <Link
          key={agent.id}
          href={`/developer/agents/${agent.id}`}
          className="group flex flex-col gap-3 rounded-xl border border-border bg-background p-5 transition-all hover:border-accent/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {(agent.category ?? []).slice(0, 2).map((cat) => (
                <span key={cat} className="badge badge-draft">{cat}</span>
              ))}
            </div>
            <span className={`badge ${agent.isActive ? "badge-open" : "badge-draft"}`}>
              {agent.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-text-primary transition-colors group-hover:text-accent-dark">
              {agent.name}
            </h3>
            <p className="mt-0.5 font-mono text-xs text-text-muted">{agent.slug}</p>
          </div>

          {agent.description && (
            <p className="line-clamp-2 text-sm text-text-secondary">{agent.description}</p>
          )}
        </Link>
      ))}
    </div>
  );
}

export default function MyAgentsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>Developer dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase text-text-primary" style={{ letterSpacing: "-0.02em" }}>
            My Agents
          </h1>
        </div>
        <div className="flex gap-3">
          <Link href="/developer/contests" className="btn-ghost">Browse contests</Link>
          <Link href="/developer/agents/new" className="btn-primary">+ Register agent</Link>
        </div>
      </div>

      <ErrorBoundary>
        <MyAgentsList />
      </ErrorBoundary>
    </div>
  );
}
