import { Worker, type Job } from "bullmq";
import { redis } from "../redis.js";
import { ContestQueue, type ContestJobData } from "../queues.js";
import { ContestStateMachine } from "~/server/services/contest/state-machine.js";
import { ContestExecutor } from "~/server/services/contest/executor.js";
import { refreshLeaderboardScores } from "~/server/services/leaderboard/scoring.js";

async function handleContestJob(job: Job<ContestJobData>): Promise<void> {
  const { contestId, action } = job.data;

  switch (action) {
    case "auto-open":
      await ContestStateMachine.autoOpenDraft();
      break;
    case "auto-lock":
      await ContestStateMachine.autoLockAtDeadline();
      await ContestStateMachine.autoResolveCompleted();
      break;
    case "auto-resolve":
      await ContestStateMachine.autoResolveCompleted();
      break;
    case "refresh-leaderboard":
      await refreshLeaderboardScores();
      break;
    case "execute-contest":
      await ContestExecutor.executeContest(contestId);
      break;
    case "create-benchmarks":
      // R-34: BenchmarkWorker
      console.log("[ContestWorker] create-benchmarks — pending R-34");
      break;
    default:
      throw new Error(`Unknown contest job action: ${String(action)}`);
  }
}

export const contestWorker = new Worker<ContestJobData>(
  "contest",
  handleContestJob,
  { connection: redis, concurrency: 5 },
);

contestWorker.on("failed", (job, err) => {
  console.error(`[ContestWorker] job ${job?.id} failed:`, err.message);
});

async function registerScheduledJobs() {
  // Every 2 min: auto-open DRAFT contests with scheduledStartAt <= now()
  await ContestQueue.upsertJobScheduler(
    "auto-open-scheduled",
    { every: 2 * 60 * 1000 },
    { name: "auto-open-scan", data: { contestId: "__scan__", action: "auto-open" } },
  );

  // Every 5 min: auto-lock at deadline-24h + auto-resolve completed contests
  await ContestQueue.upsertJobScheduler(
    "auto-lock-resolve",
    { every: 5 * 60 * 1000 },
    { name: "auto-lock-scan", data: { contestId: "__scan__", action: "auto-lock" } },
  );

  // Every 15 min: refresh leaderboard scores
  await ContestQueue.upsertJobScheduler(
    "leaderboard-refresh",
    { every: 15 * 60 * 1000 },
    { name: "refresh-leaderboard", data: { contestId: "__all__", action: "refresh-leaderboard" } },
  );
}

registerScheduledJobs().catch((err: Error) => {
  console.error("[ContestWorker] failed to register scheduled jobs:", err.message);
});

export function gracefulShutdown() {
  return contestWorker.close();
}
