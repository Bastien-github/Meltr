import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env.js";
import { db } from "~/server/db.js";

const s3 = new S3Client({ region: env.AWS_REGION });
const AUDIT_BUCKET = `${env.S3_ORACLE_EXPORT_BUCKET}-audit`;
const PRESIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export class AuditReportService {
  static async generate(contestId: string): Promise<string> {
    const contest = await db.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: {
        company: true,
        taskRuns: {
          include: {
            agent: { include: { developer: true } },
            oracleResult: true,
          },
          orderBy: { qualityScore: "desc" },
        },
      },
    });

    const leaderboard = await db.leaderboardScore.findMany({
      where: { contestId },
      include: { agent: true },
      orderBy: { rank: "asc" },
    });

    const report = buildReportJson(contest, leaderboard);
    const reportJson = JSON.stringify(report, null, 2);

    const key = `contest-audits/${contestId}/audit-report-${Date.now()}.json`;

    await s3.send(
      new PutObjectCommand({
        Bucket: AUDIT_BUCKET,
        Key: key,
        Body: reportJson,
        ContentType: "application/json",
      }),
    );

    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: AUDIT_BUCKET, Key: key }),
      { expiresIn: PRESIGNED_URL_TTL_SECONDS },
    );

    console.log(`[AuditReport] generated for contestId=${contestId} key=${key}`);
    return presignedUrl;
  }
}

function buildReportJson(
  contest: Awaited<ReturnType<typeof fetchContest>>,
  leaderboard: Awaited<ReturnType<typeof fetchLeaderboard>>,
): object {
  const winner = leaderboard[0];

  const resultsTable = (contest.taskRuns ?? []).map((run) => ({
    rank: leaderboard.findIndex((l) => l.agentId === run.agentId) + 1 || null,
    agentId: run.agentId,
    agentName: run.agent.name,
    qualityScore: run.qualityScore,
    tokensUsed: run.tokensUsed,
    durationMs: run.durationMs,
    completed: run.completed,
    oracleHash: run.oracleResult?.hash ?? null,
    onChainTxHash: run.oracleResult?.onChainTxHash ?? null,
    s3Url: run.oracleResult?.s3Url ?? null,
  }));

  return {
    _generatedAt: new Date().toISOString(),
    _verificationNote: "See /docs/oracle.md for independent verification instructions",
    contest: {
      id: contest.id,
      title: contest.title,
      company: contest.company.name,
      status: contest.status,
      deadline: contest.deadline,
      tokenBudget: contest.tokenBudget,
      judgeModelVersion: contest.judgeModelVersion,
      prizePool: contest.prizePool,
    },
    summary: {
      totalEntrants: resultsTable.length,
      winner: winner
        ? {
            agentId: winner.agentId,
            agentName: winner.agent.name,
            compositeScore: winner.compositeScore,
          }
        : null,
      averageQualityScore:
        resultsTable.length > 0
          ? resultsTable.reduce((s, r) => s + (r.qualityScore ?? 0), 0) / resultsTable.length
          : 0,
    },
    leaderboard: leaderboard.map((l) => ({
      rank: l.rank,
      agentId: l.agentId,
      agentName: l.agent.name,
      compositeScore: l.compositeScore,
      qualityScore: l.qualityScore,
      efficiencyScore: l.efficiencyScore,
    })),
    detailedResults: resultsTable,
    methodology: {
      signingAlgorithm: "HMAC-SHA256",
      compositeFormula: "quality×0.65 + efficiency×0.35",
      compositeVersion: 2,
      documentationUrl: "/docs/oracle.md",
    },
  };
}

// Type helpers for the function arguments above
async function fetchContest(contestId: string) {
  return db.contest.findUniqueOrThrow({
    where: { id: contestId },
    include: {
      company: true,
      taskRuns: {
        include: {
          agent: { include: { developer: true } },
          oracleResult: true,
        },
      },
    },
  });
}

async function fetchLeaderboard(contestId: string) {
  return db.leaderboardScore.findMany({
    where: { contestId },
    include: { agent: true },
    orderBy: { rank: "asc" },
  });
}
