import { Worker, type Job } from "bullmq";
import { redis } from "../redis.js";
import { ContestQueue, type ContestJobData } from "../queues.js";
import { db } from "~/server/db.js";
import { ARENA_PLATFORM_COMPANY_ID } from "~/lib/constants.js";

async function handleBenchmarkJob(_job: Job<ContestJobData>): Promise<void> {
  const templates = await db.benchmarkTemplate.findMany({ where: { isActive: true } });
  if (templates.length === 0) {
    console.log("[BenchmarkWorker] no active templates — skipping");
    return;
  }

  const company = await db.company.findFirst({ where: { id: ARENA_PLATFORM_COMPANY_ID } });
  if (!company) {
    console.warn("[BenchmarkWorker] Arena platform company not found — skipping");
    return;
  }

  const deadline = new Date(Date.now() + templates[0]!.durationMinutes * 60 * 1000);
  const weekLabel = new Date().toISOString().slice(0, 10);

  for (const template of templates) {
    const slug = `${template.slug}-${weekLabel}`;
    const existing = await db.contest.findUnique({ where: { slug } });
    if (existing) {
      console.log(`[BenchmarkWorker] contest already exists for slug=${slug}`);
      continue;
    }

    await db.contest.create({
      data: {
        title: `${template.title} — Week of ${weekLabel}`,
        slug,
        description: `Arena weekly benchmark: ${template.title}`,
        taskDefinition: template.taskDefinition,
        rubric: template.rubric,
        tokenBudget: template.tokenBudget,
        deadline: new Date(Date.now() + template.durationMinutes * 60 * 1000),
        judgeModelVersion: "claude-sonnet-4-6",
        status: "OPEN",
        category: template.category,
        taskVisibility: "ON_OPEN",
        companyId: company.id,
        stripePaymentIntentId: "system:benchmark",
      },
    });

    console.log(`[BenchmarkWorker] created benchmark contest slug=${slug}`);
  }

  void deadline;
}

export const benchmarkWorker = new Worker<ContestJobData>(
  "contest",
  handleBenchmarkJob,
  { connection: redis, concurrency: 1 },
);

benchmarkWorker.on("failed", (job, err) => {
  console.error(`[BenchmarkWorker] job ${job?.id} failed:`, err.message);
});

// Every Monday at 08:00 UTC
async function registerBenchmarkCron() {
  await ContestQueue.upsertJobScheduler(
    "weekly-benchmarks",
    { pattern: "0 8 * * 1" },
    { name: "create-benchmarks", data: { contestId: "__benchmarks__", action: "create-benchmarks" } },
  );
}

registerBenchmarkCron().catch((err: Error) => {
  console.error("[BenchmarkWorker] failed to register cron:", err.message);
});

export function gracefulShutdown() {
  return benchmarkWorker.close();
}
