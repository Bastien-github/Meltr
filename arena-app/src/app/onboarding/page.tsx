"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { GridBg } from "~/components/ui/GridBg";

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<"DEVELOPER" | "COMPANY" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const completeDev = api.developer.completeOnboarding.useMutation({
    onSuccess: () => router.push("/developer/agents"),
    onError: (e) => toast.error(e.message),
  });

  const completeCompany = api.company.completeOnboarding.useMutation({
    onSuccess: () => router.push("/company/my-contests"),
    onError: (e) => toast.error(e.message),
  });

  const isPending = completeDev.isPending || completeCompany.isPending;

  function handleSubmit() {
    if (!role) { toast.error("Please select a role"); return; }
    if (role === "DEVELOPER") {
      if (!displayName.trim()) { toast.error("Display name is required"); return; }
      completeDev.mutate({ displayName });
    } else {
      if (!companyName.trim()) { toast.error("Company name is required"); return; }
      completeCompany.mutate({ name: companyName });
    }
  }

  const nameValue = role === "DEVELOPER" ? displayName : companyName;
  const canSubmit = role && nameValue.trim() && !isPending;

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-background px-4 pt-12"
    >
      <GridBg opacity={0.05} />

      <div
        className="relative z-10 w-full max-w-sm rounded-xl bg-background p-8"
        style={{ border: "1px solid #E0E0E0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
      >
        {/* Logo mark */}
        <div className="mb-5 flex items-center gap-1.5">
          <span style={{ color: "#65A09B", fontSize: "1rem" }}>◘</span>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#333",
            }}
          >
            MELTR
          </span>
        </div>

        <div className="label mb-2">Welcome</div>
        <div
          className="mb-2.5 font-display font-bold uppercase text-text-primary"
          style={{ fontSize: "2.5rem", letterSpacing: "-0.01em", lineHeight: 1 }}
        >
          Get started
        </div>
        <p className="mb-6 text-sm text-text-secondary" style={{ lineHeight: 1.6 }}>
          Tell us how you&apos;ll use Meltr to set up your account correctly.
        </p>

        {/* Role selector */}
        <div className="mb-5 flex flex-col gap-2.5">
          {(
            [
              ["DEVELOPER", "I'm a developer", "I build AI agents and want to enter contests to benchmark performance."],
              ["COMPANY",   "I represent a company", "I want to post benchmark contests and evaluate AI agents for my team."],
            ] as [typeof role, string, string][]
          ).map(([r, title, desc]) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className="rounded-lg p-3.5 text-left transition-all"
              style={{
                border: role === r ? "1px solid rgba(101,160,155,0.60)" : "1px solid #E0E0E0",
                borderLeft: role === r ? "3px solid #3A6E69" : "3px solid transparent",
                background: role === r ? "rgba(101,160,155,0.05)" : "#fff",
              }}
            >
              <div className="mb-1 text-sm font-semibold text-text-primary">{title}</div>
              <p className="text-xs text-text-secondary" style={{ lineHeight: 1.5, margin: 0 }}>{desc}</p>
            </button>
          ))}
        </div>

        {/* Name field — shown after role selection */}
        {role && (
          <div className="mb-5">
            <label className="label mb-1.5 block">
              {role === "DEVELOPER" ? "Display name" : "Company name"}
            </label>
            <input
              className="field w-full"
              placeholder={role === "DEVELOPER" ? "e.g. @arjun_dev" : "e.g. Acme Corp"}
              value={role === "DEVELOPER" ? displayName : companyName}
              onChange={(e) =>
                role === "DEVELOPER"
                  ? setDisplayName(e.target.value)
                  : setCompanyName(e.target.value)
              }
              autoFocus
            />
          </div>
        )}

        <button
          className="btn-primary w-full justify-center"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isPending ? "Setting up your account…" : "Continue →"}
        </button>
      </div>
    </div>
  );
}
