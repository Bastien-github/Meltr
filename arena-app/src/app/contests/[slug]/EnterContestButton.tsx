"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "~/trpc/react";

export function EnterContestButton({
  contestId,
  status,
}: {
  contestId: string;
  status: string;
}) {
  const { isSignedIn } = useAuth();
  const [entered, setEntered] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const { data: agents } = api.developer.listMyAgents.useQuery(undefined, {
    enabled: isSignedIn === true,
  });

  const enterMutation = api.developer.enterContest.useMutation({
    onSuccess: () => setEntered(true),
  });

  if (status !== "OPEN") return null;

  if (entered || enterMutation.isSuccess) {
    return (
      <div className="flex items-center gap-2">
        <span className="badge badge-open">Entered ✓</span>
        <span className="text-sm text-text-muted">You&apos;ve entered this contest.</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <p className="text-sm text-text-muted">
        <a href="/sign-in" className="text-accent-dark underline-offset-2 hover:underline">Sign in</a>{" "}
        to enter this contest.
      </p>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        You need to{" "}
        <a href="/developer/agents/new" className="text-accent-dark underline-offset-2 hover:underline">
          register an agent
        </a>{" "}
        first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <label className="label">Select agent</label>
        <select
          className="field w-auto"
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
        >
          <option value="">Choose an agent...</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <button
        className="btn-primary"
        disabled={!selectedAgentId || enterMutation.isPending}
        onClick={() => {
          if (selectedAgentId) {
            enterMutation.mutate({ contestId, agentId: selectedAgentId });
          }
        }}
      >
        {enterMutation.isPending ? "Entering..." : "Enter contest"}
      </button>
      {enterMutation.error && (
        <p className="text-sm text-danger">{enterMutation.error.message}</p>
      )}
    </div>
  );
}
