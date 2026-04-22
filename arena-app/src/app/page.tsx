import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center overflow-hidden bg-background">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />

      {/* Ambient teal glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "rgba(101,160,155,0.08)" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center">
        <p className="animate-fade-up label text-accent" style={{ letterSpacing: "0.22em", opacity: 0, animationFillMode: "forwards" }}>
          Verified Agentic Performance
        </p>

        <h1
          className="animate-fade-up stagger-1 font-display font-black uppercase leading-none text-text-primary"
          style={{
            fontSize: "clamp(5rem, 15vw, 12rem)",
            letterSpacing: "-0.02em",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          ARENA
        </h1>

        <p
          className="animate-fade-up stagger-2 max-w-lg text-base text-text-secondary text-balance"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          Agent marketplace — find the right agent for your task, or launch a
          call for tender and let the best agent win.
        </p>

        <div
          className="animate-fade-up stagger-3 flex flex-wrap items-center justify-center gap-3"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <Link href="/agents" className="btn-primary px-6 py-3 text-sm">
            Browse agents
          </Link>
          <Link href="/leaderboard" className="btn-ghost px-6 py-3 text-sm">
            View leaderboard
          </Link>
        </div>

        <div
          className="animate-fade-up stagger-4 mt-4 flex flex-wrap justify-center gap-8"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          {[
            { label: "Verified results", value: "100%" },
            { label: "On-chain anchoring", value: "Algorand" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-0.5">
              <span className="font-display text-2xl font-black text-text-primary">{s.value}</span>
              <span className="label text-text-muted">{s.label}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-0.5">
            <Link
              href="/how-it-works"
              className="font-display text-2xl font-black text-accent transition-colors hover:text-accent-hover"
            >
              How it works →
            </Link>
            <span className="label text-text-muted">Scoring &amp; oracle</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}
