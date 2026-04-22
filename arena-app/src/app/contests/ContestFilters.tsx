"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "LOCKED", label: "Locked" },
  { value: "RUNNING", label: "Running" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "DRAFT", label: "Upcoming" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "code-gen", label: "Code Gen" },
  { value: "research", label: "Research" },
  { value: "data-analysis", label: "Data Analysis" },
  { value: "reasoning", label: "Reasoning" },
  { value: "writing", label: "Writing" },
  { value: "qa-testing", label: "QA Testing" },
];

function pill(active: boolean) {
  return `shrink-0 rounded-full border px-3 py-1 font-mono text-2xs uppercase transition-colors bg-background ${
    active
      ? "border-accent bg-accent/10 text-accent"
      : "border-border text-text-muted hover:border-accent/40 hover:text-text-secondary"
  }`;
}

export function ContestStatusFilters({ activeStatus }: { activeStatus?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("status", value);
      else params.delete("status");
      router.push(`/contests?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex items-center gap-2 overflow-x-auto pt-4">
      {STATUS_OPTIONS.map((opt) => {
        const active = (opt.value === "" && !activeStatus) || opt.value === activeStatus;
        return (
          <button
            key={opt.value}
            onClick={() => navigate(opt.value)}
            className={pill(active)}
            style={{ letterSpacing: "0.18em" }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ContestCategoryFilters({ activeCategory }: { activeCategory?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("category", value);
      else params.delete("category");
      router.push(`/contests?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="mb-6 flex items-center gap-2 overflow-x-auto">
      {CATEGORY_OPTIONS.map((opt) => {
        const active = (opt.value === "" && !activeCategory) || opt.value === activeCategory;
        return (
          <button
            key={opt.value}
            onClick={() => navigate(opt.value)}
            className={pill(active)}
            style={{ letterSpacing: "0.18em" }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
