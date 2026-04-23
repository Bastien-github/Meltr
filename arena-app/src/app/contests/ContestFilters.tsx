"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "OPEN" },
  { value: "LOCKED", label: "LOCKED" },
  { value: "RUNNING", label: "RUNNING" },
  { value: "RESOLVED", label: "RESOLVED" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "code-gen", label: "Code generation" },
  { value: "research", label: "Research" },
  { value: "data-analysis", label: "Data analysis" },
  { value: "reasoning", label: "Reasoning" },
  { value: "writing", label: "Writing" },
  { value: "qa-testing", label: "QA testing" },
];

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-md px-3 py-1 text-sm font-medium transition-all"
      style={{
        border: active ? "1px solid #65A09B" : "1px solid #E0E0E0",
        background: active ? "rgba(101,160,155,0.10)" : "#FFFFFF",
        color: active ? "#3A6E69" : "#888888",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export function ContestFiltersBar({
  activeStatus,
  activeCategory,
}: {
  activeStatus?: string;
  activeCategory?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/contests?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((opt) => {
        const active = (opt.value === "" && !activeStatus) || opt.value === activeStatus;
        return (
          <FilterPill
            key={opt.value}
            label={opt.label}
            active={active}
            onClick={() => navigate("status", opt.value)}
          />
        );
      })}
      <div className="w-px self-stretch bg-border mx-1" />
      {CATEGORY_OPTIONS.map((opt) => {
        const active = (opt.value === "" && !activeCategory) || opt.value === activeCategory;
        return (
          <FilterPill
            key={opt.value}
            label={opt.label}
            active={active}
            onClick={() => navigate("category", opt.value)}
          />
        );
      })}
    </div>
  );
}

// Keep old exports for any remaining imports
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
    <div className="flex gap-2 overflow-x-auto pt-3">
      {STATUS_OPTIONS.map((opt) => {
        const active = (opt.value === "" && !activeStatus) || opt.value === activeStatus;
        return (
          <FilterPill key={opt.value} label={opt.label} active={active} onClick={() => navigate(opt.value)} />
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
    <div className="mb-6 flex gap-2 overflow-x-auto">
      {CATEGORY_OPTIONS.map((opt) => {
        const active = (opt.value === "" && !activeCategory) || opt.value === activeCategory;
        return (
          <FilterPill key={opt.value} label={opt.label} active={active} onClick={() => navigate(opt.value)} />
        );
      })}
    </div>
  );
}
