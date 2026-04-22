import { db } from "../../db.js";
import { RunnerQueue } from "~/server/queue/queues.js";
import { ContestStateMachine } from "./state-machine.js";
import { ContestStatus } from "../../db.js";
import { v4 as uuidv4 } from "uuid";

const PER_CONTEST_MAX_CONCURRENCY = 5;

export class ContestExecutor {
  static async executeContest(contestId: string): Promise<void> {
    const contest = await db.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: {
        entries: { include: { agent: true } },
      },
    });

    if (contest.status !== ContestStatus.RUNNING) {
      console.warn(
        `[Executor] executeContest called for contestId=${contestId} but status=${contest.status} — skipping`,
      );
      return;
    }

    const entries = contest.entries;
    if (entries.length === 0) {
      console.log(`[Executor] contestId=${contestId} has no entries — auto-resolving`);
      await ContestStateMachine.transition(contestId, ContestStatus.RESOLVED, "system:no-entries");
      return;
    }

    console.log(
      `[Executor] queueing ${entries.length} task runs for contestId=${contestId}`,
    );

    // Create TaskRun rows and enqueue in batches to respect per-contest concurrency
    const chunks = chunkArray(entries, PER_CONTEST_MAX_CONCURRENCY);

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (entry) => {
          // Check if a TaskRun for this (contestId, agentId) already exists (idempotency)
          const existing = await db.taskRun.findFirst({
            where: { contestId, agentId: entry.agentId },
          });

          if (existing) {
            console.log(
              `[Executor] TaskRun already exists for contestId=${contestId} agentId=${entry.agentId} — skipping`,
            );
            return;
          }

          const idempotencyKey = uuidv4();
          const taskRun = await db.taskRun.create({
            data: {
              contestId,
              agentId: entry.agentId,
              idempotencyKey,
              startedAt: new Date(),
              completed: false,
              tokensUsed: 0,
              qualityScore: 0,
              durationMs: 0,
            },
          });

          await RunnerQueue.add(
            `run-task:${taskRun.id}`,
            {
              taskRunId: taskRun.id,
              contestId,
              agentId: entry.agentId,
            },
            {
              // Per-contest rate limiting via BullMQ group key pattern
              jobId: `contest:${contestId}:agent:${entry.agentId}`,
            },
          );

          console.log(
            `[Executor] queued taskRunId=${taskRun.id} agentId=${entry.agentId}`,
          );
        }),
      );
    }
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
