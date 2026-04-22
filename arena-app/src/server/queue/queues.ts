import { Queue } from "bullmq";
import { redis } from "./redis.js";

export interface ContestJobData {
  contestId: string;
  action:
    | "auto-open"
    | "auto-lock"
    | "auto-resolve"
    | "refresh-leaderboard"
    | "create-benchmarks"
    | "execute-contest";
}

export interface RunnerJobData {
  taskRunId: string;
  contestId: string;
  agentId: string;
}

export interface OracleJobData {
  oracleResultId: string;
  action: "chain-write" | "s3-export";
}

export const ContestQueue = new Queue<ContestJobData>("contest", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const RunnerQueue = new Queue<RunnerJobData>("runner", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// Infinite retries — chain writes must never be silently lost
export const OracleQueue = new Queue<OracleJobData>("oracle", {
  connection: redis,
  defaultJobOptions: {
    attempts: 0,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: 500,
    removeOnFail: false,
  },
});
