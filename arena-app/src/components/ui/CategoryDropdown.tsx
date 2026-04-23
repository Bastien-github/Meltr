"use client";

import { useState } from "react";

const ALL_CATEGORIES = [
  "Code generation",
  "Research",
  "Data analysis",
  "Reasoning",
  "Writing",
  "QA testing",
];

interface Props {
  selected: string[];
  onChange: (cats: string[]) => void;
  maxSelected?: number;
}

export function CategoryDropdown({ selected, onChange, maxSelected = 3 }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = ALL_CATEGORIES.filter(
    (c) => c.toLowerCase().includes(query.toLowerCase()) && !selected.includes(c),
  );

  function add(cat: string) {
    if (selected.length < maxSelected) onChange([...selected, cat]);
    setQuery("");
  }

  function remove(cat: string) {
    onChange(selected.filter((x) => x !== cat));
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Input trigger */}
      <div
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          alignItems: "center",
          border: `1px solid ${open ? "rgba(101,160,155,0.60)" : "#E0E0E0"}`,
          borderRadius: "8px",
          padding: "6px 10px",
          background: "#fff",
          minHeight: "42px",
          cursor: "text",
          boxShadow: open ? "0 0 0 1px rgba(101,160,155,0.15)" : undefined,
          transition: "all 0.15s",
        }}
      >
        {selected.map((cat) => (
          <span
            key={cat}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(101,160,155,0.10)",
              border: "1px solid rgba(101,160,155,0.40)",
              color: "#3A6E69",
              borderRadius: "4px",
              padding: "2px 8px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
          >
            {cat}
            <button
              onClick={(e) => { e.stopPropagation(); remove(cat); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#3A6E69", padding: "0 0 0 2px", lineHeight: 1, fontSize: "0.9rem" }}
            >
              ×
            </button>
          </span>
        ))}
        {selected.length < maxSelected && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? "Search categories…" : ""}
            style={{
              border: "none",
              outline: "none",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.875rem",
              color: "#333",
              flex: 1,
              minWidth: "120px",
              background: "transparent",
            }}
          />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #E0E0E0",
              borderRadius: "8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              zIndex: 99,
              overflow: "hidden",
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "10px 14px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.875rem",
                  color: "#888",
                }}
              >
                {selected.length >= maxSelected ? `Maximum ${maxSelected} categories selected.` : "No categories found."}
              </div>
            ) : (
              filtered.map((cat) => (
                <button
                  key={cat}
                  onClick={() => add(cat)}
                  className="block w-full text-left transition-colors hover:bg-surface-1"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "9px 14px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.875rem",
                    color: "#333",
                  }}
                >
                  {cat}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
