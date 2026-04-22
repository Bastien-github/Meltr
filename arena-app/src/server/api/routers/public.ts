import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc.js";
import { COMPOSITE_VERSION } from "~/lib/contest-rules.js";

export const publicRouter = createTRPCRouter({
  getPlatformStats: publicProcedure.query(async ({ ctx }) => {
    const [oracleCount, activeContests, agentCount] = await Promise.all([
      ctx.db.oracleResult.count(),
      ctx.db.contest.count({ where: { status: { in: ["OPEN", "LOCKED", "RUNNING"] } } }),
      ctx.db.agent.count({ where: { isActive: true } }),
    ]);
    return { oracleCount, activeContests, agentCount };
  }),

  listContests: publicProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "OPEN", "LOCKED", "RUNNING", "RESOLVED"]).optional(),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().cuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const contests = await ctx.db.contest.findMany({
        where: {
          ...(input.status ? { status: input.status } : { status: { not: "DRAFT" } }),
          ...(input.category ? { category: { has: input.category } } : {}),
        },
        include: {
          company: { select: { name: true, isSystem: true } },
          _count: { select: { entries: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      const hasMore = contests.length > input.limit;
      return {
        items: contests.slice(0, input.limit),
        nextCursor: hasMore ? contests[input.limit - 1]?.id : undefined,
      };
    }),

  getContestDetails: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findFirst({
        where: { slug: input.slug },
        include: {
          company: { select: { name: true, isSystem: true } },
          _count: { select: { entries: true } },
        },
      });
      if (!contest) return null;
      return contest;
    }),

  listAgents: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        sort: z.enum(["composite", "consistency", "recent"]).default("composite"),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().cuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const agents = await ctx.db.agent.findMany({
        where: {
          isActive: true,
          ...(input.category ? { category: { has: input.category } } : {}),
        },
        include: {
          developer: { select: { displayName: true } },
          leaderboardScores: {
            where: { compositeVersion: COMPOSITE_VERSION },
            orderBy: { computedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      const hasMore = agents.length > input.limit;
      const items = agents.slice(0, input.limit).map((a) => ({
        ...a,
        topScore: a.leaderboardScores[0]?.compositeScore ?? null,
      }));
      return {
        items,
        nextCursor: hasMore ? agents[input.limit - 1]?.id : undefined,
      };
    }),

  getAgentProfile: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.agent.findUnique({
        where: { slug: input.slug },
        include: {
          developer: { select: { displayName: true } },
          leaderboardScores: {
            orderBy: { computedAt: "desc" },
            include: { contest: { select: { title: true, slug: true, resolvedAt: true, company: { select: { isSystem: true } } } } },
          },
        },
      });
    }),

  getLeaderboard: publicProcedure
    .input(
      z.object({
        contestId: z.string().cuid().optional(),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(50),
        page: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.leaderboardScore.findMany({
        where: {
          compositeVersion: COMPOSITE_VERSION,
          ...(input.contestId ? { contestId: input.contestId } : {}),
        },
        include: {
          agent: { select: { name: true, slug: true, category: true } },
          contest: { select: { title: true, slug: true } },
        },
        orderBy: { compositeScore: "desc" },
        take: input.limit,
        skip: input.page * input.limit,
      });
    }),

  getGlobalLeaderboard: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.$queryRaw<
        Array<{
          agentId: string;
          agentName: string;
          agentSlug: string;
          bestCompositeScore: number;
          avgQualityScore: number;
          avgEfficiencyScore: number;
          contestCount: bigint;
          winCount: bigint;
        }>
      >`
        SELECT
          a.id AS "agentId",
          a.name AS "agentName",
          a.slug AS "agentSlug",
          MAX(ls."compositeScore") AS "bestCompositeScore",
          AVG(ls."qualityScore") AS "avgQualityScore",
          AVG(ls."efficiencyScore") AS "avgEfficiencyScore",
          COUNT(DISTINCT ls."contestId") AS "contestCount",
          SUM(CASE WHEN ls.rank = 1 THEN 1 ELSE 0 END) AS "winCount"
        FROM leaderboard_scores ls
        JOIN agents a ON a.id = ls."agentId"
        JOIN contests c ON c.id = ls."contestId"
        WHERE c.status = 'RESOLVED'
          AND ls."compositeVersion" = ${COMPOSITE_VERSION}
        GROUP BY a.id, a.name, a.slug
        ORDER BY "bestCompositeScore" DESC
        LIMIT ${input.limit}
      `;

      // Fetch categories + developer name separately (not available in raw SQL join easily)
      const agentIds = rows.map((r) => r.agentId);
      const agents = await ctx.db.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, category: true, developer: { select: { displayName: true } } },
      });
      const agentMap = new Map(agents.map((a) => [a.id, a]));

      return rows
        .filter((r) => {
          if (!input.category) return true;
          return agentMap.get(r.agentId)?.category?.includes(input.category) ?? false;
        })
        .map((r) => ({
          agentId: r.agentId,
          agentName: r.agentName,
          agentSlug: r.agentSlug,
          bestCompositeScore: Number(r.bestCompositeScore),
          avgQualityScore: Number(r.avgQualityScore),
          avgEfficiencyScore: Number(r.avgEfficiencyScore),
          contestCount: Number(r.contestCount),
          winCount: Number(r.winCount),
          categories: agentMap.get(r.agentId)?.category ?? [],
          developerName: agentMap.get(r.agentId)?.developer?.displayName ?? null,
        }));
    }),
});
