import {
  ECSClient,
  RunTaskCommand,
  StopTaskCommand,
  DescribeTasksCommand,
} from "@aws-sdk/client-ecs";
import {
  CloudWatchLogsClient,
  GetLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { env } from "~/env.js";
import { db } from "~/server/db.js";
import { OracleService } from "../oracle/index.js";
import { JudgeService } from "../judge/index.js";

const ecs = new ECSClient({ region: env.AWS_REGION });
const logs = new CloudWatchLogsClient({ region: env.AWS_REGION });

const LOG_GROUP = "/ecs/arena-runner";
const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_DURATION_MS = 20 * 60 * 1000; // 20 min hard ceiling

interface RunResult {
  agentOutput: string;
  tokensUsed: number;
  success: boolean;
  error?: string;
}

async function pollUntilStopped(
  taskArn: string,
  deadlineMs: number,
): Promise<"stopped" | "timeout" | "deadline"> {
  const ceiling = Date.now() + MAX_POLL_DURATION_MS;

  while (true) {
    if (Date.now() > deadlineMs) return "deadline";
    if (Date.now() > ceiling) return "timeout";

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const resp = await ecs.send(
      new DescribeTasksCommand({
        cluster: env.ECS_CLUSTER_ARN,
        tasks: [taskArn],
      }),
    );

    const task = resp.tasks?.[0];
    if (!task) return "timeout";
    if (task.lastStatus === "STOPPED") return "stopped";
  }
}

async function readResultFromLogs(taskArn: string): Promise<RunResult | null> {
  const taskId = taskArn.split("/").pop()!;
  const logStream = `runner/${taskId}`;

  try {
    const resp = await logs.send(
      new GetLogEventsCommand({
        logGroupName: LOG_GROUP,
        logStreamName: logStream,
        startFromHead: false,
      }),
    );

    // Find last log line containing valid JSON result
    const events = resp.events ?? [];
    for (let i = events.length - 1; i >= 0; i--) {
      const msg = events[i]!.message ?? "";
      if (msg.includes('"success"')) {
        try {
          const parsed = JSON.parse(msg) as RunResult;
          return parsed;
        } catch {
          // continue scanning
        }
      }
    }
  } catch (err) {
    console.error(`[Runner] Could not read logs for taskArn=${taskArn}: ${String(err)}`);
  }

  return null;
}

export class RunnerService {
  static async execute(taskRunId: string): Promise<void> {
    const taskRun = await db.taskRun.findUniqueOrThrow({
      where: { id: taskRunId },
      include: {
        contest: true,
        agent: true,
      },
    });

    const { contest, agent } = taskRun;
    const deadlineMs = contest.deadline ? contest.deadline.getTime() : Date.now() + 30 * 60 * 1000;
    const timeRemainingMs = deadlineMs - Date.now();

    if (timeRemainingMs <= 0) {
      await db.taskRun.update({
        where: { id: taskRunId },
        data: { completed: true, qualityScore: 0, completedAt: new Date() },
      });
      await OracleService.write(
        {
          taskRunId,
          agentId: taskRun.agentId,
          contestId: taskRun.contestId,
          tokensUsed: 0,
          qualityScore: 0,
          durationMs: 0,
        },
        taskRun.idempotencyKey,
      );
      return;
    }

    const envOverrides: Array<{ name: string; value: string }> = [
      { name: "TASK_ID", value: taskRunId },
      { name: "CONTEST_ID", value: contest.id },
      { name: "TASK_DEFINITION", value: contest.taskDefinition ?? "" },
      { name: "TOKEN_BUDGET", value: String(contest.tokenBudget) },
      { name: "DEADLINE_UNIX", value: String(Math.floor(deadlineMs / 1000)) },
      { name: "MODEL_CONFIG", value: JSON.stringify(agent.modelConfig ?? {}) },
    ];

    if (agent.webhookUrl) {
      envOverrides.push({ name: "AGENT_WEBHOOK_URL", value: agent.webhookUrl });
    }
    // Note: API key is stored bcrypt-hashed; webhook agents use their own key — not injected here

    const runTaskResp = await ecs.send(
      new RunTaskCommand({
        cluster: env.ECS_CLUSTER_ARN,
        taskDefinition: env.ECS_TASK_DEFINITION_ARN,
        launchType: "FARGATE",
        overrides: {
          containerOverrides: [
            {
              name: "runner",
              environment: envOverrides,
            },
          ],
        },
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: (process.env.ECS_SUBNET_IDS ?? "").split(",").filter(Boolean),
            assignPublicIp: "DISABLED",
          },
        },
      }),
    );

    const taskArn = runTaskResp.tasks?.[0]?.taskArn;
    if (!taskArn) {
      throw new Error(`[Runner] ECS RunTask returned no taskArn for taskRunId=${taskRunId}`);
    }

    console.log(`[Runner] ECS task started taskArn=${taskArn} taskRunId=${taskRunId}`);

    const startMs = Date.now();
    const stopReason = await pollUntilStopped(taskArn, deadlineMs);

    if (stopReason === "deadline") {
      console.warn(`[Runner] deadline reached, stopping ECS task taskArn=${taskArn}`);
      await ecs.send(new StopTaskCommand({
        cluster: env.ECS_CLUSTER_ARN,
        task: taskArn,
        reason: "Arena deadline exceeded",
      }));
    }

    const durationMs = Date.now() - startMs;
    const result = await readResultFromLogs(taskArn);

    const tokensUsed = result?.tokensUsed ?? 0;
    const agentOutput = result?.agentOutput ?? "";
    const ranSuccessfully = result?.success === true && stopReason === "stopped";

    // Kill if token budget exceeded
    if (tokensUsed > contest.tokenBudget) {
      console.warn(`[Runner] token budget exceeded tokensUsed=${tokensUsed} budget=${contest.tokenBudget}`);
      // ECS task may already be stopped; StopTask is idempotent
      await ecs.send(new StopTaskCommand({
        cluster: env.ECS_CLUSTER_ARN,
        task: taskArn,
        reason: "Token budget exceeded",
      })).catch(() => void 0);
    }

    let qualityScore = 0;
    if (ranSuccessfully && agentOutput) {
      try {
        const judgeResult = await JudgeService.score({
          agentOutput,
          rubric: contest.rubric ?? "",
          task: contest.taskDefinition ?? "",
          judgeModelVersion: contest.judgeModelVersion,
          contestId: contest.id,
          isTest: false,
        });
        qualityScore = judgeResult.score;
      } catch (err) {
        console.error(`[Runner] Judge scoring failed for taskRunId=${taskRunId}: ${String(err)}`);
      }
    }

    await db.taskRun.update({
      where: { id: taskRunId },
      data: {
        tokensUsed,
        qualityScore,
        durationMs,
        completed: ranSuccessfully,
        completedAt: new Date(),
      },
    });

    await OracleService.write(
      {
        taskRunId,
        agentId: taskRun.agentId,
        contestId: taskRun.contestId,
        tokensUsed,
        qualityScore,
        durationMs,
      },
      taskRun.idempotencyKey,
    );

    console.log(
      `[Runner] complete taskRunId=${taskRunId} success=${ranSuccessfully} ` +
      `tokensUsed=${tokensUsed} qualityScore=${qualityScore} durationMs=${durationMs}`,
    );
  }
}
