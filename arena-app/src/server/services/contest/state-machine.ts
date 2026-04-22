import { ContestStatus } from "../../db.js";
import { db } from "../../db.js";
import { TRPCError } from "@trpc/server";
import { ContestQueue } from "~/server/queue/queues.js";

type Transition = {
  from: ContestStatus;
  to: ContestStatus;
};

const ALLOWED_TRANSITIONS: Transition[] = [
  { from: ContestStatus.DRAFT, to: ContestStatus.OPEN },
  { from: ContestStatus.OPEN, to: ContestStatus.LOCKED },
  { from: ContestStatus.LOCKED, to: ContestStatus.RUNNING },
  { from: ContestStatus.RUNNING, to: ContestStatus.RESOLVED },
];

export class ContestStateMachine {
  static canTransition(from: ContestStatus, to: ContestStatus): boolean {
    return ALLOWED_TRANSITIONS.some((t) => t.from === from && t.to === to);
  }

  static async transition(
    contestId: string,
    toStatus: ContestStatus,
    triggeredBy: string,
  ): Promise<void> {
    await db.$transaction(async (tx) => {
      const contest = await tx.contest.findUniqueOrThrow({
        where: { id: contestId },
      });

      if (!this.canTransition(contest.status, toStatus)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition contest from ${contest.status} to ${toStatus}`,
        });
      }

      // Prerequisites per transition
      if (toStatus === ContestStatus.OPEN) {
        if (!contest.tokenBudget || contest.tokenBudget <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "tokenBudget must be > 0" });
        }
        if (!contest.deadline) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "deadline must be set" });
        }
        if (!contest.rubric || contest.rubric.trim().length < 10) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "rubric must be provided" });
        }
        if (!contest.stripePaymentIntentId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment not confirmed" });
        }
      }

      await tx.contest.update({
        where: { id: contestId },
        data: { status: toStatus },
      });

      await tx.contestStateLog.create({
        data: { contestId, fromStatus: contest.status, toStatus, triggeredBy },
      });
    });

    console.log(`[StateMachine] contest=${contestId} → ${toStatus} by ${triggeredBy}`);

    // Side effects after commit
    if (toStatus === ContestStatus.LOCKED) {
      await this._triggerHealthChecks(contestId);
    }

    if (toStatus === ContestStatus.RUNNING) {
      await ContestQueue.add("execute-contest", {
        contestId,
        action: "execute-contest" as never,
      });
    }
  }

  private static async _triggerHealthChecks(contestId: string): Promise<void> {
    const entries = await db.contestEntry.findMany({
      where: { contestId },
      include: { agent: true },
    });

    await Promise.allSettled(
      entries.map((entry) => this._pingAgent(entry.agent.id, contestId)),
    );
  }

  private static async _pingAgent(agentId: string, contestId: string): Promise<void> {
    const agent = await db.agent.findUniqueOrThrow({ where: { id: agentId } });
    const now = new Date();

    if (!agent.webhookUrl) {
      // No webhook configured — mark as not checked (not failed)
      await db.contestEntry.update({
        where: { contestId_agentId: { contestId, agentId } },
        data: { healthCheckAt: now, healthCheckPassed: null, healthCheckError: "No webhook configured" },
      });
      return;
    }

    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 5_000);

      const resp = await fetch(agent.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "health_check", contestId, timestamp: now.toISOString() }),
        signal: ac.signal,
      });

      clearTimeout(timer);

      const passed = resp.ok;
      await db.contestEntry.update({
        where: { contestId_agentId: { contestId, agentId } },
        data: {
          healthCheckPassed: passed,
          healthCheckAt: now,
          healthCheckError: passed ? null : `HTTP ${resp.status}`,
        },
      });

      console.log(`[StateMachine] health-check agentId=${agentId} passed=${passed}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await db.contestEntry.update({
        where: { contestId_agentId: { contestId, agentId } },
        data: { healthCheckPassed: false, healthCheckAt: now, healthCheckError: msg },
      });
      console.warn(`[StateMachine] health-check failed agentId=${agentId}: ${msg}`);
    }
  }

  // --- Scheduled job handlers ---

  static async autoOpenDraft(): Promise<void> {
    const now = new Date();
    const contests = await db.contest.findMany({
      where: {
        status: ContestStatus.DRAFT,
        scheduledStartAt: { lte: now },
        stripePaymentIntentId: { not: null },
      },
    });

    for (const contest of contests) {
      await this.transition(contest.id, ContestStatus.OPEN, "system:scheduled-open").catch((err) =>
        console.error(`[StateMachine] auto-open failed contestId=${contest.id}: ${String(err)}`),
      );
    }
  }

  static async autoLockAtDeadline(): Promise<void> {
    const lockThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const contests = await db.contest.findMany({
      where: {
        status: ContestStatus.OPEN,
        deadline: { lte: lockThreshold },
      },
    });

    for (const contest of contests) {
      await this.transition(contest.id, ContestStatus.LOCKED, "system:deadline-lock").catch(
        (err) =>
          console.error(`[StateMachine] auto-lock failed contestId=${contest.id}: ${String(err)}`),
      );
    }
  }

  static async autoResolveCompleted(): Promise<void> {
    const contests = await db.contest.findMany({
      where: { status: ContestStatus.RUNNING },
      include: {
        _count: { select: { taskRuns: true } },
        entries: { select: { agentId: true } },
      },
    });

    for (const contest of contests) {
      const totalEntries = contest.entries.length;
      if (totalEntries === 0) continue;

      const completedRuns = await db.taskRun.count({
        where: { contestId: contest.id, completed: true },
      });

      if (completedRuns >= totalEntries) {
        await this.transition(contest.id, ContestStatus.RESOLVED, "system:auto-resolve").catch(
          (err) =>
            console.error(
              `[StateMachine] auto-resolve failed contestId=${contest.id}: ${String(err)}`,
            ),
        );
      }
    }
  }
}
