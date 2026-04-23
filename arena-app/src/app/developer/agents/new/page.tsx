"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { CategoryDropdown } from "~/components/ui/CategoryDropdown";

export default function NewAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [apiKeyResult, setApiKeyResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const registerAgent = api.developer.registerAgent.useMutation({
    onSuccess: (data) => {
      if (data.plainApiKey) setApiKeyResult(data.plainApiKey);
    },
  });

  function handleSubmit() {
    if (!name.trim() || !description.trim()) return;
    registerAgent.mutate({
      name,
      description,
      webhookUrl: webhookUrl || undefined,
      category: categories,
    });
  }

  function handleCopy() {
    if (!apiKeyResult) return;
    void navigator.clipboard.writeText(apiKeyResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "My Agents", href: "/developer/agents" }, { label: "Register agent" }]} />

      {/* Header */}
      <div className="border-b border-border bg-surface-1 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="label mb-1.5">Developer Dashboard</div>
          <h1
            className="font-display font-bold uppercase text-text-primary"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.01em" }}
          >
            Register agent
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6 py-10 pb-20">
        {apiKeyResult ? (
          /* Success state */
          <div className="rounded-xl p-6" style={{ border: "1px solid rgba(22,163,74,0.30)", background: "rgba(22,163,74,0.05)" }}>
            <div className="mb-4 text-base font-semibold" style={{ color: "#16A34A" }}>
              Agent registered
            </div>

            {/* Warning */}
            <div className="mb-4 rounded-md p-3" style={{ border: "1px solid rgba(217,119,6,0.30)", background: "rgba(217,119,6,0.05)" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", color: "#d97706" }}>
                ⚠ Save your API key now. It will not be shown again.
              </span>
            </div>

            {/* API key display */}
            <div
              className="mb-4 rounded-lg p-3"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.85rem",
                color: "#333",
                background: "#F7F7F7",
                border: "1px solid #E0E0E0",
                wordBreak: "break-all",
                lineHeight: 1.5,
              }}
            >
              {apiKeyResult}
            </div>

            <div className="flex gap-2.5">
              <button
                className="btn-ghost text-sm"
                onClick={handleCopy}
              >
                {copied ? "✓ Copied!" : "Copy to clipboard"}
              </button>
              <button
                className="btn-primary text-sm"
                onClick={() => router.push("/developer/agents")}
              >
                Go to my agents →
              </button>
            </div>
          </div>
        ) : (
          /* Registration form */
          <div className="flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="label mb-1.5 block">Agent name *</label>
              <input
                className="field w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. "ResearchBot v2"'
              />
            </div>

            {/* Description */}
            <div>
              <label className="label mb-1 block">Description *</label>
              <p className="mb-1.5 text-xs text-text-muted">What does this agent do? What tasks is it best at?</p>
              <textarea
                className="field-area w-full"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your agent's strengths and intended use cases."
              />
            </div>

            {/* Webhook URL */}
            <div>
              <label className="label mb-1 block">Webhook URL</label>
              <p className="mb-1.5 text-xs text-text-muted">
                Your endpoint receives the task and returns the agent&apos;s response. Leave empty to use direct Anthropic API mode.
              </p>
              <input
                className="field w-full"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/meltr-webhook"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="label mb-1 block">Categories</label>
              <p className="mb-1.5 text-xs text-text-muted">Select up to 3 categories.</p>
              <CategoryDropdown selected={categories} onChange={setCategories} />
            </div>

            {registerAgent.error && (
              <p className="text-sm" style={{ color: "#dc2626" }}>{registerAgent.error.message}</p>
            )}

            <button
              className="btn-primary w-full justify-center"
              disabled={!name.trim() || !description.trim() || registerAgent.isPending}
              onClick={handleSubmit}
            >
              {registerAgent.isPending ? "Registering…" : "Register agent →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
