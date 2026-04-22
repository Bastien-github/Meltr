import { z } from "zod";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import { createTRPCRouter, companyProcedure, onboardingProcedure } from "~/server/api/trpc.js";
import { CreateContestInput, UpdateContestInput, TestRubricInput } from "~/lib/validators/contest.js";
import { AuditReportService } from "~/server/services/audit/report-generator.js";
import { ContestStateMachine } from "~/server/services/contest/state-machine.js";
import { PLATFORM_FEE_CENTS } from "~/lib/billing.js";
import { env } from "~/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });

// Rate limit: 5 free rubric test calls per contest
const TEST_RUBRIC_LIMIT = 5;

export const companyRouter = createTRPCRouter({
  completeOnboarding: onboardingProcedure
    .input(z.object({ name: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const [company] = await ctx.db.$transaction([
        ctx.db.company.upsert({
          where: { userId: ctx.user.id },
          create: { userId: ctx.user.id, name: input.name },
          update: { name: input.name },
        }),
        ctx.db.user.update({
          where: { id: ctx.user.id },
          data: { role: "COMPANY" },
        }),
      ]);
      const clerk = await clerkClient();
      await clerk.users.updateUser(ctx.clerkUserId!, {
        publicMetadata: { onboardingComplete: true, role: "COMPANY" },
      });
      return company;
    }),

  createContest: companyProcedure
    .input(CreateContestInput)
    .mutation(async ({ ctx, input }) => {
      const slug = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
      return ctx.db.contest.create({
        data: {
          ...input,
          slug,
          companyId: ctx.company.id,
          status: "DRAFT",
        },
      });
    }),

  updateContest: companyProcedure
    .input(UpdateContestInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const contest = await ctx.db.contest.findFirst({
        where: { id, companyId: ctx.company.id },
      });
      if (!contest) throw new TRPCError({ code: "NOT_FOUND" });
      if (contest.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only DRAFT contests can be edited" });
      }
      return ctx.db.contest.update({ where: { id }, data });
    }),

  listMyContests: companyProcedure.query(async ({ ctx }) => {
    return ctx.db.contest.findMany({
      where: { companyId: ctx.company.id },
      include: { _count: { select: { entries: true, taskRuns: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  getContestResults: companyProcedure
    .input(z.object({ contestId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.contest.findFirst({
        where: { id: input.contestId, companyId: ctx.company.id },
        include: {
          _count: { select: { entries: true } },
          taskRuns: {
            include: {
              agent: { select: { name: true, slug: true } },
              oracleResult: { select: { hash: true, onChainTxHash: true, s3Url: true } },
            },
            orderBy: { qualityScore: "desc" },
          },
        },
      });
    }),

  downloadAuditReport: companyProcedure
    .input(z.object({ contestId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findFirst({
        where: { id: input.contestId, companyId: ctx.company.id, status: "RESOLVED" },
      });
      if (!contest) throw new TRPCError({ code: "NOT_FOUND" });
      const url = await AuditReportService.generate(input.contestId);
      return { url };
    }),

  testRubric: companyProcedure
    .input(TestRubricInput)
    .mutation(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findFirst({
        where: { id: input.contestId, companyId: ctx.company.id },
      });
      if (!contest) throw new TRPCError({ code: "NOT_FOUND" });

      // Rate limit: 5 test calls per contest
      const testCount = await ctx.db.judgeLog.count({
        where: { contestId: input.contestId, isTest: true },
      });
      if (testCount >= TEST_RUBRIC_LIMIT) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Maximum ${TEST_RUBRIC_LIMIT} rubric test calls per contest reached`,
        });
      }

      // Full implementation in R-08: JudgeService.score()
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Judge service pending R-08" });
    }),

  requestPayment: companyProcedure
    .input(z.object({ contestId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findFirst({
        where: { id: input.contestId, companyId: ctx.company.id, status: "DRAFT" },
      });
      if (!contest) throw new TRPCError({ code: "NOT_FOUND" });

      // Upsert Stripe customer for company
      let stripeCustomerId = ctx.company.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          metadata: { companyId: ctx.company.id },
        });
        stripeCustomerId = customer.id;
        await ctx.db.company.update({
          where: { id: ctx.company.id },
          data: { stripeCustomerId },
        });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: PLATFORM_FEE_CENTS,
              product_data: { name: `Arena Contest: ${contest.title}` },
            },
            quantity: 1,
          },
        ],
        metadata: { contestId: contest.id },
        success_url: `${baseUrl}/company/contests/${contest.id}?payment=success`,
        cancel_url: `${baseUrl}/company/contests/${contest.id}?payment=cancelled`,
      });

      return { checkoutUrl: session.url };
    }),

  transitionContest: companyProcedure
    .input(z.object({
      contestId: z.string().cuid(),
      toStatus: z.enum(["LOCKED", "RUNNING"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findFirst({
        where: { id: input.contestId, companyId: ctx.company.id },
      });
      if (!contest) throw new TRPCError({ code: "NOT_FOUND" });
      await ContestStateMachine.transition(
        input.contestId,
        input.toStatus as "LOCKED" | "RUNNING",
        `company:${ctx.company.id}`,
      );
      return { success: true };
    }),
});
