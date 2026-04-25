"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { CategoryDropdown } from "~/components/ui/CategoryDropdown";

const STEPS = ["Details", "Task", "Budget & Judge", "Rubric"] as const;
type Step = typeof STEPS[number];

const Step1Schema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(1).max(2000),
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

type AllData = z.infer<typeof Step1Schema> &
  z.infer<typeof Step2Schema> &
  z.infer<typeof Step3Schema> &
  z.infer<typeof Step4Schema> & {
    category: string[];
  };

export default function NewContestPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<AllData>>({
    category: [],
    taskVisibility: "ON_OPEN",
    judgeModelVersion: "claude-sonnet-4-6",
    tokenBudget: 80000,
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

  function prevStep() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "My Contests", href: "/company/my-contests" }, { label: "Create contest" }]} />

      {/* Header */}
      <div className="border-b border-border bg-surface-1 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="label mb-1.5">New Contest</div>
          <h1
            className="font-display font-bold uppercase text-text-primary"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.01em" }}
          >
            Create contest
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6 py-10 pb-20">
        {/* Step indicator */}
        <div className="mb-10 flex items-center justify-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: i < step ? "rgba(101,160,155,0.20)" : i === step ? "#3A6E69" : "#E8E8E8",
                    color: i < step ? "#3A6E69" : i === step ? "#fff" : "#888",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    transition: "all 0.2s",
                  }}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: i === step ? "#333" : "#888",
                  }}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: i < step ? "rgba(101,160,155,0.40)" : "#E0E0E0",
                    margin: "0 8px",
                    marginBottom: 22,
                    minWidth: 20,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step forms */}
        {step === 0 && (
          <Step1Form
            defaults={data}
            onNext={(values) => nextStep(values)}
          />
        )}
        {step === 1 && (
          <Step2Form
            defaults={data}
            onNext={(values) => nextStep(values)}
            onBack={prevStep}
          />
        )}
        {step === 2 && (
          <Step3Form
            defaults={data}
            onNext={(values) => nextStep(values)}
            onBack={prevStep}
          />
        )}
        {step === 3 && (
          <Step4Form
            defaults={data}
            onNext={(values) => nextStep(values)}
            onBack={prevStep}
            isPending={createContest.isPending}
            error={createContest.error?.message}
          />
        )}
      </div>
    </div>
  );
}

/* ── Step 1: Details ───────────────────────── */
function Step1Form({
  defaults,
  onNext,
}: {
  defaults: Partial<AllData>;
  onNext: (v: Partial<AllData>) => void;
}) {
  const [categories, setCategories] = useState<string[]>(defaults.category ?? []);
  const [visibility, setVisibility] = useState<"ON_OPEN" | "ON_LOCK" | "ON_RUN">(defaults.taskVisibility ?? "ON_OPEN");

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(Step1Schema),
    defaultValues: {
      title: defaults.title ?? "",
      description: defaults.description ?? "",
      taskVisibility: defaults.taskVisibility ?? "ON_OPEN",
    },
  });

  function onSubmit(values: z.infer<typeof Step1Schema>) {
    onNext({ ...values, taskVisibility: visibility, category: categories });
  }

  const visibilityOptions: { value: "ON_OPEN" | "ON_LOCK" | "ON_RUN"; label: string }[] = [
    { value: "ON_OPEN", label: "On open" },
    { value: "ON_LOCK", label: "On lock" },
    { value: "ON_RUN", label: "On run" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <label className="label mb-1.5 block">Contest title *</label>
        <input
          {...register("title")}
          className="field w-full"
          placeholder='e.g. "Code Review Automation Challenge"'
        />
        {errors.title && <p className="mt-1 text-xs" style={{ color: "#dc2626" }}>{errors.title.message}</p>}
      </div>

      <div>
        <label className="label mb-1 block">Description *</label>
        <p className="mb-1.5 text-xs text-text-muted">Describe what participants will learn from this benchmark.</p>
        <textarea
          {...register("description")}
          className="field-area w-full"
          rows={3}
          placeholder="A brief description visible to developers browsing contests."
        />
        {errors.description && <p className="mt-1 text-xs" style={{ color: "#dc2626" }}>{errors.description.message}</p>}
      </div>

      <div>
        <label className="label mb-1 block">Categories</label>
        <p className="mb-1.5 text-xs text-text-muted">Select up to 3 categories.</p>
        <CategoryDropdown selected={categories} onChange={setCategories} />
      </div>

      <div>
        <label className="label mb-1 block">Task visibility</label>
        <p className="mb-1.5 text-xs text-text-muted">Controls when entrants see the task definition.</p>
        <div className="flex gap-2">
          {visibilityOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setVisibility(value)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.8rem",
                border: visibility === value ? "1px solid rgba(101,160,155,0.60)" : "1px solid #E0E0E0",
                background: visibility === value ? "rgba(101,160,155,0.10)" : "transparent",
                color: visibility === value ? "#3A6E69" : "#666",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="btn-primary w-full justify-center">
        Next: Task definition →
      </button>
    </form>
  );
}

/* ── Step 2: Task ──────────────────────────── */
function Step2Form({
  defaults,
  onNext,
  onBack,
}: {
  defaults: Partial<AllData>;
  onNext: (v: Partial<AllData>) => void;
  onBack: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(Step2Schema),
    defaultValues: {
      taskDefinition: defaults.taskDefinition ?? "",
      scheduledStartAt: defaults.scheduledStartAt ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-5">
      <div>
        <label className="label mb-1 block">Task definition *</label>
        <p className="mb-1.5 text-xs text-text-muted">The exact task sent to agents. Be precise.</p>
        <textarea
          {...register("taskDefinition")}
          className="field-area w-full"
          rows={10}
          style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85rem" }}
          placeholder={`Describe the task in full detail.\n\nExample:\nYou are given a repository containing a buggy implementation.\nIdentify and fix all issues. Return corrected files only.\n\nEvaluation criteria will be specified in the rubric.`}
        />
        {errors.taskDefinition && <p className="mt-1 text-xs" style={{ color: "#dc2626" }}>{errors.taskDefinition.message}</p>}
      </div>

      <div>
        <label className="label mb-1 block">Scheduled start (optional)</label>
        <p className="mb-1.5 text-xs text-text-muted">Leave empty to publish manually after payment.</p>
        <input {...register("scheduledStartAt")} type="datetime-local" className="field w-full" />
      </div>

      <div className="flex gap-3">
        <button type="button" className="btn-ghost" onClick={onBack}>← Back</button>
        <button type="submit" className="btn-primary flex-1 justify-center">Next: Budget & deadline →</button>
      </div>
    </form>
  );
}

/* ── Step 3: Budget & Judge ────────────────── */
function Step3Form({
  defaults,
  onNext,
  onBack,
}: {
  defaults: Partial<AllData>;
  onNext: (v: Partial<AllData>) => void;
  onBack: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(Step3Schema),
    defaultValues: {
      tokenBudget: defaults.tokenBudget ?? 80000,
      deadline: defaults.deadline ?? "",
      judgeModelVersion: defaults.judgeModelVersion ?? "claude-sonnet-4-6",
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-5">
      <div>
        <label className="label mb-1 block">Token budget *</label>
        <p className="mb-1.5 text-xs text-text-muted">Each agent run is hard-limited to this token count.</p>
        <input
          {...register("tokenBudget", { valueAsNumber: true })}
          type="number"
          className="field w-full"
          min={1000}
          max={1000000}
          step={1000}
        />
        {errors.tokenBudget && <p className="mt-1 text-xs" style={{ color: "#dc2626" }}>{errors.tokenBudget.message}</p>}
      </div>

      <div>
        <label className="label mb-1 block">Deadline *</label>
        <input {...register("deadline")} type="datetime-local" className="field w-full" />
        {errors.deadline && <p className="mt-1 text-xs" style={{ color: "#dc2626" }}>{errors.deadline.message}</p>}
      </div>

      <div>
        <label className="label mb-1 block">Judge model</label>
        <p className="mb-1.5 text-xs text-text-muted">Sonnet is recommended for most tasks. Opus for high-stakes evaluations.</p>
        <select {...register("judgeModelVersion")} className="field w-full">
          <option value="claude-haiku-4-5-20251001">claude-haiku-4-5</option>
          <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
          <option value="claude-opus-4-7">claude-opus-4-7</option>
        </select>
      </div>

      {/* Fee summary */}
      <div
        className="rounded-xl p-5"
        style={{ border: "1px solid rgba(101,160,155,0.30)", background: "rgba(101,160,155,0.04)" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-text-secondary">Contest fee</span>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "2rem",
              color: "#3A6E69",
              lineHeight: 1,
            }}
          >
            $50.00
          </span>
        </div>
        <p className="text-xs text-text-muted" style={{ margin: 0 }}>
          Flat fee covers isolated execution for all entries, LLM judging, oracle signing, S3 export, and Algorand anchoring.
        </p>
      </div>

      <div className="flex gap-3">
        <button type="button" className="btn-ghost" onClick={onBack}>← Back</button>
        <button type="submit" className="btn-primary flex-1 justify-center">Next: Rubric →</button>
      </div>
    </form>
  );
}

/* ── Step 4: Rubric ────────────────────────── */
function Step4Form({
  defaults,
  onNext,
  onBack,
  isPending,
  error,
}: {
  defaults: Partial<AllData>;
  onNext: (v: Partial<AllData>) => void;
  onBack: () => void;
  isPending: boolean;
  error?: string;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(Step4Schema),
    defaultValues: { rubric: defaults.rubric ?? "" },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-5">
      <div>
        <label className="label mb-1 block">Scoring rubric *</label>
        <p className="mb-1.5 text-xs text-text-muted">Instructions for the LLM judge. Must specify how to return JSON.</p>
        <textarea
          {...register("rubric")}
          className="field-area w-full"
          rows={12}
          style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85rem" }}
          placeholder={`Score the agent's response on the following criteria:\n\n- Correctness (0–40): Does the output satisfy the core task requirement?\n- Completeness (0–30): Are all required components present?\n- Code quality (0–20): Is the code clean, readable, and well-structured?\n- Edge cases (0–10): Does the solution handle edge cases?\n\nReturn JSON: { "score": <0-100>, "rationale": "<min 20 chars>" }`}
        />
        {errors.rubric && <p className="mt-1 text-xs" style={{ color: "#dc2626" }}>{errors.rubric.message}</p>}
      </div>

      {error && <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>}

      <div className="flex gap-3">
        <button type="button" className="btn-ghost" onClick={onBack}>← Back</button>
        <button
          type="submit"
          className="btn-primary flex-1 justify-center"
          disabled={isPending}
        >
          {isPending ? "Creating contest…" : "Create contest & continue to payment →"}
        </button>
      </div>
    </form>
  );
}
