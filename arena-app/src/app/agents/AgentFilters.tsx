"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const CATEGORY_OPTIONS = [
  { value: "", label: "All" },
  { value: "code-gen", label: "Code generation" },
  { value: "research", label: "Research" },
  { value: "data-analysis", label: "Data analysis" },
  { value: "reasoning", label: "Reasoning" },
  { value: "writing", label: "Writing" },
  { value: "qa-testing", label: "QA testing" },
];

const SORT_OPTIONS = [
  { value: "", label: "Best score" },
  { value: "contests", label: "Most contests" },
  { value: "recent", label: "Newest" },
];

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
    <div className="flex gap-2 overflow-x-auto">
      {CATEGORY_OPTIONS.map((opt) => {
        const active = (opt.value === "" && !activeCategory) || opt.value === activeCategory;
        return (
          <button
            key={opt.value}
            onClick={() => navigate(opt.value)}
            className="shrink-0 rounded-md px-3 py-1 text-sm font-medium transition-all"
            style={{
              border: active ? "1px solid #65A09B" : "1px solid #E0E0E0",
              background: active ? "rgba(101,160,155,0.10)" : "#FFFFFF",
              color: active ? "#3A6E69" : "#888888",
              whiteSpace: "nowrap",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function AgentSortSelect({ activeSort }: { activeSort?: string }) {
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
    <select
      value={activeSort ?? ""}
      onChange={(e) => navigate(e.target.value)}
      className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-sm text-text-secondary outline-none"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
