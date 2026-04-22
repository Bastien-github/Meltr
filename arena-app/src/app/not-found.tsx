import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-4 px-4">
      <p className="label text-accent" style={{ letterSpacing: "0.22em" }}>Page not found</p>
      <h1
        className="font-display text-[8rem] font-black uppercase leading-none text-text-primary"
        style={{ letterSpacing: "-0.02em" }}
      >
        404
      </h1>
      <p className="max-w-sm text-center text-sm text-text-muted text-balance">
        This page doesn&apos;t exist. It may have been moved or deleted.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Back to Meltr
      </Link>
    </div>
  );
}
