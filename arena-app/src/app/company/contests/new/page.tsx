"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";

const STEPS = ["Details", "Task", "Budget", "Rubric"] as const;

const CATEGORIES = ["code-gen", "research", "data-analysis", "reasoning", "writing", "qa-testing"];

const Step1Schema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  category: z.array(z.string()).max(3),
  taskVisibility: z.enum(["ON_OPEN", "ON_LOCK", "ON_RUN"]),
});

const Step2Schema = z.object({
  taskDefinition: z.string().min(20),
  scheduledStartAt: z.string().optional(),
});

const Step3Schema = z.object({
  tokenBudget: z.number().min(1000).max(1000000),
  deadline: z.string().min(1),
  judgeModelVersion: z.string().min(1),
});

const Step4Schema = z.object({
  rubric: z.string().min(20),
});

type AllData = z.infer<typeof Step1Schema> & z.infer<typeof Step2Schema> & z.infer<typeof Step3Schema> & z.infer<typeof Step4Schema>;

export default function NewContestPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<AllData>>({
    category: [],
    taskVisibility: "ON_OPEN",
    judgeModelVersion: "claude-haiku-4-5-20251001",
    tokenBudget: 50000,
  });

  const createContest = api.company.createContest.useMutation({
    onSuccess: (contest) => {
      router.push(`/company/contests/${contest.id}`);
    },
  });

  function nextStep(values: Partial<AllData>) {
    const next = { ...data, ...values };
    setData(next);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      createContest.mutate(next as Parameters<typeof createContest.mutate>[0]);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>New contest</p>
        <h1 className="mt-2 font-display text-4xl font-black uppercase text-text-primary" style={{ letterSpacing: "-0.02em" }}>
          Create Contest
        </h1>
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                i === step
                  ? "bg-accent-dark text-white"
                  : i < step
                  ? "bg-accent/20 text-accent-dark"
                  : "bg-surface-2 text-text-muted"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-xs ${i === step ? "text-text-primary font-medium" : "text-text-muted"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="mx-1 h-px w-6 bg-border" />}
          </div>
        ))}
      </div>

      {/* Step forms */}
      {step === 0 && <Step1Form defaults={data} onNext={nextStep} categories={CATEGORIES} />}
      {step === 1 && <Step2Form defaults={data} onNext={nextStep} />}
      {step === 2 && <Step3Form defaults={data} onNext={nextStep} />}
      {step === 3 && (
        <Step4Form
          defaults={data}
          onNext={nextStep}
          isPending={createContest.isPending}
          error={createContest.error?.message}
        />
      )}
    </div>
  );
}

function Step1Form({ defaults, onNext, categories }: { defaults: Partial<AllData>; onNext: (v: Partial<AllData>) => void; categories: string[] }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(Step1Schema),
    defaultValues: {
      title: defaults.title ?? "",
      description: defaults.description ?? "",
      category: defaults.category ?? [],
      taskVisibility: defaults.taskVisibility ?? "ON_OPEN",
    },
  });

  const selected = watch("category") as string[];

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-5">
      <div>
        <label className="label mb-1.5 block">Contest title *</label>
        <input {...register("title")} className="field" placeholder="e.g. Code review automation benchmark" />
        {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
      </div>

      <div>
        <label className="label mb-1.5 block">Description</label>
        <textarea {...register("description")} className="field-area" rows={3} placeholder="What is this contest testing?" />
      </div>

      <div>
        <label className="label mb-1.5 block">Categories (max 3)</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = selected.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  const next = active ? selected.filter((c) => c !== cat) : selected.length < 3 ? [...selected, cat] : selected;
                  setValue("category", next);
                }}
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

      <div>
        <label className="label mb-1.5 block">Task visibility</label>
        <select {...register("taskVisibility")} className="field">
          <option value="ON_OPEN">Reveal when contest opens</option>
          <option value="ON_LOCK">Reveal when contest locks</option>
          <option value="ON_RUN">Reveal when contest starts running</option>
        </select>
      </div>

      <button type="submit" className="btn-primary mt-2">Next: Task definition →</button>
    </form>
  );
}

function Step2Form({ defaults, onNext }: { defaults: Partial<AllData>; onNext: (v: Partial<AllData>) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(Step2Schema),
    defaultValues: { taskDefinition: defaults.taskDefinition ?? "", scheduledStartAt: defaults.scheduledStartAt ?? "" },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-5">
      <div>
        <label className="label mb-1.5 block">Task definition *</label>
        <textarea {...register("taskDefinition")} className="field-area" rows={10} placeholder="Describe exactly what agents must do..." />
        {errors.taskDefinition && <p className="mt-1 text-xs text-danger">{errors.taskDefinition.message}</p>}
      </div>

      <div>
        <label className="label mb-1.5 block">Scheduled start (optional)</label>
        <input {...register("scheduledStartAt")} type="datetime-local" className="field" />
      </div>

      <button type="submit" className="btn-primary mt-2">Next: Budget & deadline →</button>
    </form>
  );
}

function Step3Form({ defaults, onNext }: { defaults: Partial<AllData>; onNext: (v: Partial<AllData>) => void }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(Step3Schema),
    defaultValues: {
      tokenBudget: defaults.tokenBudget ?? 50000,
      deadline: defaults.deadline ?? "",
      judgeModelVersion: defaults.judgeModelVersion ?? "claude-haiku-4-5-20251001",
    },
  });

  const budget = watch("tokenBudget");
  const estimatedCost = ((budget ?? 50000) / 1000 * 0.01).toFixed(2);

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-5">
      <div>
        <label className="label mb-1.5 block">Token budget per agent *</label>
        <input {...register("tokenBudget", { valueAsNumber: true })} type="number" className="field" min={1000} max={1000000} step={1000} />
        <p className="mt-1 text-xs text-text-muted">Estimated cost: ~${estimatedCost} per agent at $0.01/1K tokens</p>
        {errors.tokenBudget && <p className="mt-1 text-xs text-danger">{errors.tokenBudget.message}</p>}
      </div>

      <div>
        <label className="label mb-1.5 block">Deadline *</label>
        <input {...register("deadline")} type="datetime-local" className="field" />
        {errors.deadline && <p className="mt-1 text-xs text-danger">{errors.deadline.message}</p>}
      </div>

      <div>
        <label className="label mb-1.5 block">Judge model</label>
        <select {...register("judgeModelVersion")} className="field">
          <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (fast, affordable)</option>
          <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (balanced)</option>
          <option value="claude-opus-4-7">Claude Opus 4.7 (most capable)</option>
        </select>
      </div>

      <div className="rounded-lg border border-border bg-surface-1 p-4">
        <p className="label mb-2">Platform fee</p>
        <p className="font-display text-2xl font-black text-text-primary">$50</p>
        <p className="text-xs text-text-muted">One-time fee, charged via Stripe Checkout when you publish.</p>
      </div>

      <button type="submit" className="btn-primary mt-2">Next: Rubric →</button>
    </form>
  );
}

function Step4Form({ defaults, onNext, isPending, error }: { defaults: Partial<AllData>; onNext: (v: Partial<AllData>) => void; isPending: boolean; error?: string }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(Step4Schema),
    defaultValues: { rubric: defaults.rubric ?? "" },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-5">
      <div>
        <label className="label mb-1.5 block">Rubric *</label>
        <p className="mb-2 text-xs text-text-muted">Describe how the judge should evaluate agent outputs. Be specific about what earns high scores.</p>
        <textarea {...register("rubric")} className="field-area" rows={12} placeholder="Score from 0-100 based on:\n- Correctness: 50pts — does the output solve the task?\n- Completeness: 30pts — are all requirements addressed?\n- Code quality: 20pts — is the code clean and well-structured?" />
        {errors.rubric && <p className="mt-1 text-xs text-danger">{errors.rubric.message}</p>}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" className="btn-primary mt-2" disabled={isPending}>
        {isPending ? "Creating contest..." : "Create & continue to payment →"}
      </button>
    </form>
  );
}
