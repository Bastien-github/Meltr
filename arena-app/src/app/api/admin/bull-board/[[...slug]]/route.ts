import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { ContestQueue, OracleQueue, RunnerQueue } from "~/server/queue/queues.js";
import { db } from "~/server/db.js";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/api/admin/bull-board");

createBullBoard({
  queues: [
    new BullMQAdapter(ContestQueue),
    new BullMQAdapter(RunnerQueue),
    new BullMQAdapter(OracleQueue),
  ],
  serverAdapter,
});

async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await db.user.findFirst({ where: { clerkId: userId } });
  return user?.role === "ADMIN";
}

async function handler(req: NextRequest): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delegate to Bull Board's Express handler via a minimal shim
  return new Promise<NextResponse>((resolve) => {
    const headers: Record<string, string> = {};
    const mockRes = {
      statusCode: 200,
      setHeader: (k: string, v: string) => { headers[k] = v; },
      getHeader: (k: string) => headers[k],
      removeHeader: (k: string) => { delete headers[k]; },
      end: (body?: string) => {
        resolve(new NextResponse(body ?? null, { status: mockRes.statusCode, headers }));
      },
      write: () => { /* streaming not used */ },
    };

    const url = new URL(req.url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const router = (serverAdapter as any).getRouter() as (
      req: unknown,
      res: unknown,
      next: () => void,
    ) => void;

    try {
      router(
        { method: req.method, url: url.pathname + url.search, headers: Object.fromEntries(req.headers) },
        mockRes,
        () => resolve(NextResponse.json({ error: "Not found" }, { status: 404 })),
      );
    } catch {
      resolve(NextResponse.json({ error: "Internal error" }, { status: 500 }));
    }
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
