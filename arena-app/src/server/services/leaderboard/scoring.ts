import { db } from "../../db.js";
import { ContestStatus } from "../../db.js";
import { COMPOSITE_VERSION, computeCompositeScore } from "~/lib/contest-rules.js";

const RELIABLE_BADGE_MIN_CONTESTS = 5;
const RELIABLE_BADGE_MIN_CONSISTENCY = 85;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export async function calculateCompositeScore(
  agentId: string,
  contestId: string,
): Promise<{ compositeScore: number; efficiencyScore: number; qualityScore: number } | null> {
  const taskRun = await db.taskRun.findFirst({
    where: { agentId, contestId, completed: true },
    include: { contest: true },
  });

  if (!taskRun) return null;

  const qualityScore = taskRun.qualityScore ?? 0;
  const tokensUsed = taskRun.tokensUsed ?? 0;
  const tokenBudget = taskRun.contest.tokenBudget;

  const efficiencyScore = tokenBudget > 0
    ? Math.max(0, 1 - tokensUsed / tokenBudget) * 100
    : 0;

  const compositeScore = computeCompositeScore({ qualityScore, tokensUsed, tokenBudget });

  return { compositeScore, efficiencyScore, qualityScore };
}

export async function crossContestConsistencyScore(agentId: string): Promise<number | null> {
  const scores = await db.leaderboardScore.findMany({
    where: { agentId, compositeVersion: COMPOSITE_VERSION },
    select: { compositeScore: true },
  });

  if (scores.length < 3) return null;

  const values = scores.map((s) => s.compositeScore);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;

  const cv = stddev(values) / mean;
  return 100 * (1 - clamp(cv, 0, 1));
}

export async function hasReliableBadge(agentId: string): Promise<boolean> {
  const scores = await db.leaderboardScore.findMany({
    where: { agentId, compositeVersion: COMPOSITE_VERSION },
    select: { compositeScore: true },
  });

  if (scores.length < RELIABLE_BADGE_MIN_CONTESTS) return false;

  const values = scores.map((s) => s.compositeScore);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return false;

  const cv = stddev(values) / mean;
  const consistency = 100 * (1 - clamp(cv, 0, 1));
  return consistency > RELIABLE_BADGE_MIN_CONSISTENCY;
}

export async function refreshLeaderboardScores(): Promise<void> {
  const resolvedContests = await db.contest.findMany({
    where: { status: ContestStatus.RESOLVED },
    select: { id: true, tokenBudget: true },
  });

  for (const contest of resolvedContests) {
    const taskRuns = await db.taskRun.findMany({
      where: { contestId: contest.id, completed: true },
      select: { agentId: true, tokensUsed: true, qualityScore: true, durationMs: true },
      orderBy: { qualityScore: "desc" },
    });

    if (taskRuns.length === 0) continue;

    const scored = taskRuns.map((run) => {
      const qualityScore = run.qualityScore ?? 0;
      const tokensUsed = run.tokensUsed ?? 0;
      const tokenBudget = contest.tokenBudget;
      const efficiencyScore = tokenBudget > 0
        ? Math.max(0, 1 - tokensUsed / tokenBudget) * 100
        : 0;
      const compositeScore = computeCompositeScore({ qualityScore, tokensUsed, tokenBudget });
      return { ...run, qualityScore, tokensUsed, efficiencyScore, compositeScore };
    });

    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    for (let i = 0; i < scored.length; i++) {
      const run = scored[i]!;
      const rank = i + 1;
      const consistencyScore = await crossContestConsistencyScore(run.agentId);

      await db.leaderboardScore.upsert({
        where: {
          agentId_contestId_compositeVersion: {
            agentId: run.agentId,
            contestId: contest.id,
            compositeVersion: COMPOSITE_VERSION,
          },
        },
        create: {
          agentId: run.agentId,
          contestId: contest.id,
          qualityScore: run.qualityScore,
          efficiencyScore: run.efficiencyScore,
          consistencyScore: consistencyScore ?? undefined,
          compositeScore: run.compositeScore,
          compositeVersion: COMPOSITE_VERSION,
          rank,
          computedAt: new Date(),
        },
        update: {
          qualityScore: run.qualityScore,
          efficiencyScore: run.efficiencyScore,
          consistencyScore: consistencyScore ?? undefined,
          compositeScore: run.compositeScore,
          rank,
          computedAt: new Date(),
        },
      });
    }

    console.log(`[Leaderboard] refreshed ${scored.length} scores for contestId=${contest.id}`);
  }
}
