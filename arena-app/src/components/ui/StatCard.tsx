interface StatCardProps {
  label: string;
  value: string | number;
  mono?: boolean;
}

export function StatCard({ label, value, mono }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="label mb-1.5">{label}</div>
      <div
        className="text-[2rem] font-bold leading-none text-text-primary"
        style={{
          fontFamily: mono
            ? "'DM Mono', monospace"
            : "'Barlow Condensed', sans-serif",
        }}
      >
        {value}
      </div>
    </div>
  );
}
