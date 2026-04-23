"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useUser, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";

interface DropdownPos {
  top: number;
  left: number;
}

function MoreDropdown({ pos, onClose }: { pos: DropdownPos; onClose: () => void }) {
  useEffect(() => {
    const handleScroll = () => onClose();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed z-[9999] w-48 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
      style={{ top: pos.top, left: pos.left }}
      onMouseLeave={onClose}
    >
      <Link
        href="/how-it-works"
        className="block px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-1 hover:text-text-primary"
        onClick={onClose}
      >
        How it works
      </Link>
      <Link
        href="/docs"
        className="block px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-1 hover:text-text-primary"
        onClick={onClose}
      >
        Documentation
      </Link>
    </div>,
    document.body,
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`relative flex h-12 items-center text-sm transition-colors ${
        active
          ? "text-text-primary"
          : "text-text-muted hover:text-text-secondary"
      }`}
    >
      {children}
      {active && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-dark" />
      )}
    </Link>
  );
}

export function Header() {
  const { isSignedIn, user } = useUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? "";

  const [moreOpen, setMoreOpen] = useState(false);
  const [morePos, setMorePos] = useState<DropdownPos>({ top: 0, left: 0 });
  const moreRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function openMore() {
    const rect = moreRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMorePos({ top: rect.bottom + 4, left: rect.left });
    setMoreOpen(true);
  }

  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = () => setMoreOpen(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [moreOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-12 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="relative mx-auto flex h-full max-w-screen-2xl items-center px-6">
        {/* Logo */}
        <Link
          href="/"
          className="mr-8 flex shrink-0 items-center gap-1.5 text-text-primary"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "1.1rem",
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
          }}
        >
          <span className="text-accent">◘</span>
          <span className="hidden sm:block">MELTR</span>
          <span className="sm:hidden">M</span>
        </Link>

        {/* Center nav — main links */}
        <nav className="hidden flex-1 items-center gap-6 md:flex">
          <NavLink href="/leaderboard">Leaderboard</NavLink>
          <NavLink href="/agents">Marketplace</NavLink>
          <NavLink href="/contests">Contests</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>

          {/* More dropdown */}
          <div className="relative">
            <button
              ref={moreRef}
              onClick={(e) => {
                e.stopPropagation();
                moreOpen ? setMoreOpen(false) : openMore();
              }}
              className="flex h-12 items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-secondary"
            >
              More
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2.5 4.5l3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Right side: role-specific links + auth */}
        <div className="flex items-center gap-5 ml-auto">
          {/* Role-specific links */}
          {isSignedIn && role === "DEVELOPER" && (
            <>
              <NavLink href="/developer/agents">My Agents</NavLink>
              <NavLink href="/developer/analytics">Analytics</NavLink>
            </>
          )}
          {isSignedIn && role === "COMPANY" && (
            <NavLink href="/company/my-contests">My Contests</NavLink>
          )}
          {isSignedIn && role === "ADMIN" && (
            <NavLink href="/admin/queues">Queue Monitor</NavLink>
          )}

          {/* Auth */}
          {isSignedIn ? (
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          ) : (
            <div className="flex items-center gap-2.5">
              <SignInButton mode="modal">
                <button className="text-sm text-text-muted transition-colors hover:text-text-primary">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-md bg-accent-dark px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-darker">
                  Sign up →
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>

      {/* Bottom gradient accent line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />

      {/* Portal dropdown */}
      {mounted && moreOpen && (
        <MoreDropdown pos={morePos} onClose={() => setMoreOpen(false)} />
      )}
    </header>
  );
}
