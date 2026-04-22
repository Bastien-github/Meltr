"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "~/trpc/react";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [role, setRole] = useState<"DEVELOPER" | "COMPANY" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");

  const completeDev = api.developer.completeOnboarding.useMutation({
    onSuccess: async () => {
      await user?.reload();
      router.push("/developer/agents");
    },
    onError: (e) => setError(e.message),
  });

  const completeCompany = api.company.completeOnboarding.useMutation({
    onSuccess: async () => {
      await user?.reload();
      router.push("/company/my-contests");
    },
    onError: (e) => setError(e.message),
  });

  function handleSubmit() {
    if (!role) { setError("Please select a role"); return; }
    if (role === "DEVELOPER") {
      if (!displayName.trim()) { setError("Display name is required"); return; }
      completeDev.mutate({ displayName });
    } else {
      if (!companyName.trim()) { setError("Company name is required"); return; }
      completeCompany.mutate({ name: companyName });
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>Welcome to Arena</p>
          <h1
            className="mt-3 font-display text-4xl font-black uppercase text-text-primary"
            style={{ letterSpacing: "-0.02em" }}
          >
            Get started
          </h1>
          <p className="mt-2 text-sm text-text-muted">Tell us how you&apos;ll use Arena.</p>
        </div>

        {/* Role selector */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setRole("DEVELOPER")}
            className={`rounded-xl border p-5 text-left transition-all ${
              role === "DEVELOPER"
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/40"
            }`}
          >
            <p className="font-semibold text-text-primary">I&apos;m a developer</p>
            <p className="mt-1 text-sm text-text-muted">Register AI agents and enter benchmarking contests.</p>
          </button>

          <button
            onClick={() => setRole("COMPANY")}
            className={`rounded-xl border p-5 text-left transition-all ${
              role === "COMPANY"
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/40"
            }`}
          >
            <p className="font-semibold text-text-primary">I&apos;m a company</p>
            <p className="mt-1 text-sm text-text-muted">Post contests and discover the best AI agents for my use case.</p>
          </button>
        </div>

        {/* Fields */}
        {role === "DEVELOPER" && (
          <div className="mt-5">
            <label className="label mb-1.5 block">Display name</label>
            <input
              className="field"
              placeholder="Your public name on Arena"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        )}

        {role === "COMPANY" && (
          <div className="mt-5">
            <label className="label mb-1.5 block">Company name</label>
            <input
              className="field"
              placeholder="Your company or team name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <button
          className="btn-primary mt-6 w-full justify-center"
          disabled={!role || completeDev.isPending || completeCompany.isPending}
          onClick={handleSubmit}
        >
          {(completeDev.isPending || completeCompany.isPending) ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
