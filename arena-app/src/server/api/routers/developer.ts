import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import slugify from "slugify";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import { createTRPCRouter, developerProcedure, onboardingProcedure, requirePro } from "~/server/api/trpc.js";
import { RegisterAgentInput, UpdateAgentInput, EnterContestInput } from "~/lib/validators/agent.js";
import { env } from "~/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });

function generateShortId(len = 6): string {
  return randomBytes(Math.ceil(len * 0.75))
    .toString("base64url")
    .slice(0, len);
}

export const developerRouter = createTRPCRouter({
  registerAgent: developerProcedure
    .input(RegisterAgentInput)
    .mutation(async ({ ctx, input }) => {
      const plainApiKey = randomBytes(32).toString("hex");
      const hashedApiKey = await hash(plainApiKey, 12);
      const slug = `${slugify(input.name, { lower: true, strict: true })}-${generateShortId()}`;

      const agent = await ctx.db.agent.create({
        data: {
          ...input,
          slug,
          developerId: ctx.developer.id,
          apiKey: hashedApiKey,
        },
      });

      // Return plaintext key ONCE — never stored, cannot be retrieved again
      return { agent, plainApiKey };
    }),

  updateAgent: developerProcedure
    .input(UpdateAgentInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const agent = await ctx.db.agent.findFirst({
        where: { id, developerId: ctx.developer.id },
      });
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.agent.update({ where: { id }, data });
    }),

  listMyAgents: developerProcedure.query(async ({ ctx }) => {
    return ctx.db.agent.findMany({
      where: { developerId: ctx.developer.id },
      include: {
        _count: { select: { contestEntries: true } },
        leaderboardScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  enterContest: developerProcedure
    .input(EnterContestInput)
    .mutation(async ({ ctx, input }) => {
      const [contest, agent] = await Promise.all([
        ctx.db.contest.findUnique({
          where: { id: input.contestId },
          include: { company: true },
        }),
        ctx.db.agent.findFirst({
          where: { id: input.agentId, developerId: ctx.developer.id, isActive: true },
        }),
      ]);

      if (!contest) throw new TRPCError({ code: "NOT_FOUND", message: "Contest not found" });
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (contest.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Contest is not open for entries" });
      }

      // System/benchmark contests require Pro subscription
      if (contest.company.isSystem && ctx.developer.subscriptionTier !== "pro") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Arena Benchmark contests require a Pro subscription",
        });
      }

      return ctx.db.contestEntry.create({
        data: { contestId: input.contestId, agentId: input.agentId },
      });
    }),

  getMyProfile: developerProcedure.query(async ({ ctx }) => {
    return ctx.db.developer.findUnique({
      where: { id: ctx.developer.id },
      include: {
        agents: { where: { isActive: true }, select: { id: true, name: true, slug: true } },
      },
    });
  }),

  // Pro-only: DeepEval supplemental scores for recent task runs
  getDeepEvalScores: developerProcedure
    .use(requirePro)
    .query(async ({ ctx }) => {
      const agentIds = (
        await ctx.db.agent.findMany({
          where: { developerId: ctx.developer.id },
          select: { id: true },
        })
      ).map((a) => a.id);

      return ctx.db.taskRun.findMany({
        where: {
          agentId: { in: agentIds },
          completed: true,
          OR: [
            { deepEvalGEval: { not: null } },
            { deepEvalAnswerRelevancy: { not: null } },
          ],
        },
        include: {
          agent: { select: { name: true, slug: true } },
          contest: { select: { title: true, slug: true } },
        },
        orderBy: { completedAt: "desc" },
        take: 50,
      });
    }),

  // Pro-only: analytics summary across all agents
  getAnalyticsSummary: developerProcedure
    .use(requirePro)
    .query(async ({ ctx }) => {
      const agentIds = (
        await ctx.db.agent.findMany({
          where: { developerId: ctx.developer.id },
          select: { id: true },
        })
      ).map((a) => a.id);

      const scores = await ctx.db.leaderboardScore.findMany({
        where: { agentId: { in: agentIds } },
        include: {
          agent: { select: { name: true, slug: true } },
          contest: { select: { title: true, slug: true, resolvedAt: true } },
        },
        orderBy: { computedAt: "desc" },
      });

      return scores;
    }),

  completeOnboarding: onboardingProcedure
    .input(z.object({ displayName: z.string().min(1).max(100), bio: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const [developer] = await ctx.db.$transaction([
        ctx.db.developer.upsert({
          where: { userId: ctx.user.id },
          create: { userId: ctx.user.id, displayName: input.displayName, bio: input.bio },
          update: { displayName: input.displayName, bio: input.bio },
        }),
        ctx.db.user.update({
          where: { id: ctx.user.id },
          data: { role: "DEVELOPER" },
        }),
      ]);
      const clerk = await clerkClient();
      await clerk.users.updateUser(ctx.clerkUserId!, {
        publicMetadata: { onboardingComplete: true, role: "DEVELOPER" },
      });
      return developer;
    }),

  upgradeSubscription: developerProcedure
    .input(z.object({ plan: z.enum(["monthly", "annual"]) }))
    .mutation(async ({ ctx, input }) => {
      let stripeCustomerId = ctx.developer.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          metadata: { developerId: ctx.developer.id },
        });
        stripeCustomerId = customer.id;
        await ctx.db.developer.update({
          where: { id: ctx.developer.id },
          data: { stripeCustomerId },
        });
      }

      const priceId = input.plan === "monthly"
        ? env.STRIPE_PRICE_PRO_MONTHLY
        : env.STRIPE_PRICE_PRO_ANNUAL;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/developer/agents?subscription=success`,
        cancel_url: `${baseUrl}/pricing?subscription=cancelled`,
      });

      return { checkoutUrl: session.url };
    }),

  cancelSubscription: developerProcedure
    .mutation(async ({ ctx }) => {
      const { stripeSubscriptionId } = ctx.developer;
      if (!stripeSubscriptionId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription" });
      }
      // Cancel at period end — don't revoke access immediately
      await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      return { success: true };
    }),
});
