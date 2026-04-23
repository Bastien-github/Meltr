"use client";

import { useEffect, useState } from "react";

export function compositeColor(v: number) {
  if (v >= 85) return "#15803d";
  if (v >= 70) return "#65A09B";
  if (v >= 55) return "#d97706";
  return "#dc2626";
}

interface ScoreBarProps {
  value: number;
  max?: number;
  height?: number;
  color?: string;
}

export function ScoreBar({ value, max = 100, height = 3, color }: ScoreBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), 200);
    return () => clearTimeout(t);
  }, [value, max]);

  const fill = color ?? "linear-gradient(90deg, #65A09B, #3A6E69)";

  return (
    <div
      style={{
        background: "#E0E0E0",
        borderRadius: "999px",
        height,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: "999px",
          background: fill,
          width: `${width}%`,
          transition: "width 0.6s ease-out",
        }}
      />
    </div>
  );
}
