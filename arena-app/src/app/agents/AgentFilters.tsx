"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "code-gen", label: "Code Gen" },
  { value: "research", label: "Research" },
  { value: "data-analysis", label: "Data Analysis" },
  { value: "reasoning", label: "Reasoning" },
  { value: "writing", label: "Writing" },
  { value: "qa-testing", label: "QA Testing" },
];

const SORT_OPTIONS = [
  { value: "", label: "Best score" },
  { value: "recent", label: "Most recent" },
  { value: "consistent", label: "Most consistent" },
];

function pill(active: boolean) {
  return `shrink-0 rounded-full border px-3 py-1 font-mono text-2xs uppercase transition-colors bg-background ${
    active
      ? "border-accent bg-accent/10 text-accent"
      : "border-border text-text-muted hover:border-accent/40 hover:text-text-secondary"
  }`;
}

export function AgentCategoryFilters({ activeCategory }: { activeCategory?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("category", value);
      else params.delete("category");
      router.push(`/agents?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex items-center gap-2 overflow-x-auto pt-4">
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

export function AgentSortFilters({ activeSort }: { activeSort?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("sort", value);
      else params.delete("sort");
      router.push(`/agents?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="mb-6 flex items-center justify-end gap-2 overflow-x-auto">
      {SORT_OPTIONS.map((opt) => {
        const active = (opt.value === "" && !activeSort) || opt.value === activeSort;
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
