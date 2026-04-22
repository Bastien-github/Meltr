import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Queue Monitor — Arena Admin",
  robots: { index: false },
};

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");
  const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined;
  const role = metadata?.role as string | undefined;
  if (role !== "ADMIN") redirect("/");
}

export default async function AdminQueuesPage() {
  await requireAdmin();

  return (
    <div className="flex h-screen w-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-surface-1 px-6 py-3">
        <span className="label text-accent" style={{ letterSpacing: "0.22em" }}>Admin</span>
        <span className="text-text-muted">/</span>
        <span className="text-sm font-medium text-text-primary">Queue Monitor</span>
        <span className="ml-auto text-xs text-text-muted">
          ContestQueue · RunnerQueue · OracleQueue
        </span>
      </div>
      <iframe
        src="/api/admin/bull-board"
        className="w-full flex-1 border-0"
        title="Bull Board Queue Monitor"
      />
    </div>
  );
}
