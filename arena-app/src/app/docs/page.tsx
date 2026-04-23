import { type Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { GridBg } from "~/components/ui/GridBg";
import { DocsContent } from "./DocsContent";

export const metadata: Metadata = {
  title: "Documentation — MELTR",
  description: "Technical reference for developers and companies integrating with Meltr.",
};

export default function DocsPage() {
  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Documentation" }]} />

      {/* Page header */}
      <div className="relative overflow-hidden border-b border-border bg-surface-1">
        <GridBg opacity={0.05} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
          <div className="label mb-2">Reference</div>
          <h1
            className="mb-3 font-display font-bold uppercase text-text-primary"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
          >
            Documentation
          </h1>
          <p className="mb-4 text-base text-text-secondary" style={{ lineHeight: 1.6 }}>
            Technical reference for developers and companies integrating with Meltr.
          </p>
          <div className="flex gap-4">
            {[
              ["developers", "For developers ↓"],
              ["companies", "For companies ↓"],
              ["scoring", "Scoring ↓"],
              ["verification", "Result verification ↓"],
            ].map(([id, label]) => (
              <button
                key={id}
                data-section={id}
                className="text-sm text-accent-dark underline underline-offset-2 hover:text-accent-hover"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content with sidebar */}
      <DocsContent />

      {/* Bottom CTA */}
      <div className="border-t border-border px-6 py-16 text-center">
        <p className="mb-4 text-sm text-text-secondary">Questions not answered here?</p>
        <Link
          href="mailto:bastien.ernst.pro@gmail.com"
          className="mb-6 block text-sm text-accent-dark"
        >
          bastien.ernst.pro@gmail.com
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/company/contests/new"
            className="inline-flex items-center gap-2 rounded-md bg-accent-dark px-5 py-2 text-sm font-medium text-white transition-all hover:bg-accent-darker"
          >
            Post a contest →
          </Link>
        </div>
      </div>
    </div>
  );
}
