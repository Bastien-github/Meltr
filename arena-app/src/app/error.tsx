"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-4 px-4">
      <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>Something went wrong</p>
      <h1
        className="font-display text-5xl font-black uppercase text-text-primary"
        style={{ letterSpacing: "-0.02em" }}
      >
        Error
      </h1>
      <p className="max-w-sm text-center text-sm text-text-muted">
        {error.message ?? "An unexpected error occurred."}
      </p>
      <button onClick={reset} className="btn-primary mt-2">
        Try again
      </button>
    </div>
  );
}
