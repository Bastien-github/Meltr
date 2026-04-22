import { Worker, type Job } from "bullmq";
import { redis } from "../redis.js";
import { type RunnerJobData } from "../queues.js";
import { RunnerService } from "~/server/services/runner/index.js";
import { ContestStateMachine } from "~/server/services/contest/state-machine.js";

const GLOBAL_MAX_CONCURRENCY = 20;

async function handleRunnerJob(job: Job<RunnerJobData>): Promise<void> {
  const { taskRunId, contestId } = job.data;

  await RunnerService.execute(taskRunId);

  // After each run, check whether the whole contest can now be resolved
  await ContestStateMachine.autoResolveCompleted().catch((err) =>
    console.error(
      `[RunnerWorker] autoResolve check failed after taskRunId=${taskRunId}: ${String(err)}`,
    ),
  );

  void contestId;
}

export const runnerWorker = new Worker<RunnerJobData>(
  "runner",
  handleRunnerJob,
  { connection: redis, concurrency: GLOBAL_MAX_CONCURRENCY },
);

runnerWorker.on("failed", (job, err) => {
  console.error(
    `[RunnerWorker] job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
  );
});

export function gracefulShutdown() {
  return runnerWorker.close();
}
