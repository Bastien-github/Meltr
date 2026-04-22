import { Worker, type Job } from "bullmq";
import { redis } from "../redis.js";
import { type OracleJobData } from "../queues.js";
import { ChainService } from "~/server/services/chain/index.js";
import { S3ExportService } from "~/server/services/oracle/s3-export.js";
import { db } from "~/server/db.js";

const MAX_BACKOFF_MS = 60 * 60 * 1000; // 1 hour cap
const ALERT_AFTER_ATTEMPTS = 10;

async function handleOracleJob(job: Job<OracleJobData>): Promise<void> {
  const { oracleResultId, action } = job.data;

  if ((job.attemptsMade ?? 0) >= ALERT_AFTER_ATTEMPTS) {
    console.error(
      `[OracleWorker] ALERT: job ${job.id} has failed ${job.attemptsMade} times`,
      { oracleResultId, action },
    );
  }

  switch (action) {
    case "chain-write": {
      const result = await db.oracleResult.findUniqueOrThrow({
        where: { id: oracleResultId },
      });
      const txHash = await ChainService.submitResult(result);
      // onChainTxHash is status metadata — written via owner connection (not arena_app role)
      await db.oracleResult.update({
        where: { id: oracleResultId },
        data: { onChainTxHash: txHash },
      });
      console.log(`[OracleWorker] chain-write complete oracleResultId=${oracleResultId} txHash=${txHash}`);
      break;
    }
    case "s3-export": {
      await S3ExportService.export(oracleResultId);
      break;
    }
    default:
      throw new Error(`Unknown oracle job action: ${String(action)}`);
  }
}

export const oracleWorker = new Worker<OracleJobData>(
  "oracle",
  handleOracleJob,
  { connection: redis, concurrency: 10 },
);

oracleWorker.on("failed", (job, err) => {
  const backoffMs = Math.min(10000 * Math.pow(2, job?.attemptsMade ?? 0), MAX_BACKOFF_MS);
  console.error(
    `[OracleWorker] job ${job?.id} failed (attempt ${job?.attemptsMade}), ` +
    `next retry in ${Math.round(backoffMs / 1000)}s: ${err.message}`,
  );
});

export function gracefulShutdown() {
  return oracleWorker.close();
}
