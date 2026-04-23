export function GridBg({ opacity = 0.08 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage: `linear-gradient(rgba(101,160,155,${opacity}) 1px, transparent 1px), linear-gradient(90deg, rgba(101,160,155,${opacity}) 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }}
    />
  );
}
