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

export function ContestFilters({
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
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/contests?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="sticky top-12 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-2 py-3">
          {/* Status pills */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {STATUS_OPTIONS.map((opt) => {
              const active = (opt.value === "" && !activeStatus) || opt.value === activeStatus;
              return (
                <button
                  key={opt.value}
                  onClick={() => navigate("status", opt.value)}
                  className={`shrink-0 rounded-full border px-3 py-1 font-mono text-2xs uppercase transition-colors bg-background ${
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-muted hover:border-accent/40 hover:text-text-secondary"
                  }`}
                  style={{ letterSpacing: "0.18em" }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {CATEGORY_OPTIONS.map((opt) => {
              const active = (opt.value === "" && !activeCategory) || opt.value === activeCategory;
              return (
                <button
                  key={opt.value}
                  onClick={() => navigate("category", opt.value)}
                  className={`shrink-0 rounded-full border px-3 py-1 font-mono text-2xs uppercase transition-colors bg-background ${
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-muted hover:border-accent/40 hover:text-text-secondary"
                  }`}
                  style={{ letterSpacing: "0.18em" }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
