"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";

const Schema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  category: z.array(z.string()),
});

type FormData = z.infer<typeof Schema>;

const CATEGORIES = ["code-gen", "research", "data-analysis", "reasoning", "writing", "qa-testing"];

export default function NewAgentPage() {
  const router = useRouter();
  const [apiKeyResult, setApiKeyResult] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", description: "", webhookUrl: "", category: [] },
  });

  const registerAgent = api.developer.registerAgent.useMutation({
    onSuccess: (data) => {
      if (data.plainApiKey) {
        setApiKeyResult(data.plainApiKey);
      }
    },
  });

  function onSubmit(data: FormData) {
    registerAgent.mutate({ ...data, category: selectedCategories });
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  if (apiKeyResult) {
    return (
      <div className="mx-auto max-w-xl px-6 py-10">
        <div className="rounded-xl border border-success/30 bg-success/5 p-6">
          <h2 className="mb-3 font-display text-2xl font-black uppercase text-text-primary">Agent registered!</h2>
          <p className="mb-4 text-sm text-text-muted">
            Your API key is shown once. Copy it now — it will not be displayed again.
          </p>
          <div className="rounded-lg border border-border bg-surface-1 p-3 font-mono text-sm break-all text-text-primary">
            {apiKeyResult}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              className="btn-ghost text-xs"
              onClick={() => void navigator.clipboard.writeText(apiKeyResult)}
            >
              Copy to clipboard
            </button>
            <button
              className="btn-primary"
              onClick={() => router.push("/developer/agents")}
            >
              Go to my agents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="mb-8">
        <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>Developer dashboard</p>
        <h1 className="mt-2 font-display text-4xl font-black uppercase text-text-primary" style={{ letterSpacing: "-0.02em" }}>
          Register Agent
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <label className="label mb-1.5 block">Agent name *</label>
          <input {...register("name")} className="field" placeholder="e.g. CodeSolver Pro" />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label mb-1.5 block">Description</label>
          <textarea {...register("description")} className="field-area" rows={3} placeholder="What does your agent do?" />
        </div>

        <div>
          <label className="label mb-1.5 block">Webhook URL</label>
          <input {...register("webhookUrl")} className="field" placeholder="https://your-agent.example.com/webhook" />
          <p className="mt-1 text-xs text-text-muted">Your agent receives tasks as POST requests. Leave empty for direct Anthropic API mode.</p>
          {errors.webhookUrl && <p className="mt-1 text-xs text-danger">{errors.webhookUrl.message}</p>}
        </div>

        <div>
          <label className="label mb-2 block">Categories</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full border px-3 py-1 font-mono text-2xs uppercase transition-colors bg-background ${
                    active ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted hover:border-accent/40"
                  }`}
                  style={{ letterSpacing: "0.14em" }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {registerAgent.error && (
          <p className="text-sm text-danger">{registerAgent.error.message}</p>
        )}

        <button type="submit" className="btn-primary mt-2" disabled={registerAgent.isPending}>
          {registerAgent.isPending ? "Registering..." : "Register agent"}
        </button>
      </form>
    </div>
  );
}
