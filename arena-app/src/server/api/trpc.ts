import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { compare } from "bcryptjs";
import { db } from "~/server/db.js";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId } = await auth();

  return {
    db,
    clerkUserId: userId,
    ...opts,
  };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  if (t._config.isDev) {
    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 400) + 100));
  }
  const result = await next();
  console.log(`[TRPC] ${path} took ${Date.now() - start}ms`);
  return result;
});

// Requires a valid Clerk session
const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.clerkUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const user = await db.user.findFirst({ where: { clerkId: ctx.clerkUserId } });
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user } });
});

// Requires role === COMPANY
const enforceCompany = t.middleware(async ({ ctx, next }) => {
  if (!ctx.clerkUserId) throw new TRPCError({ code: "UNAUTHORIZED" });
  const user = await db.user.findFirst({
    where: { clerkId: ctx.clerkUserId },
    include: { company: true },
  });
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (user.role !== "COMPANY") throw new TRPCError({ code: "FORBIDDEN" });
  if (!user.company) throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, user, company: user.company } });
});

// Requires role === DEVELOPER
const enforceDeveloper = t.middleware(async ({ ctx, next }) => {
  if (!ctx.clerkUserId) throw new TRPCError({ code: "UNAUTHORIZED" });
  const user = await db.user.findFirst({
    where: { clerkId: ctx.clerkUserId },
    include: { developer: true },
  });
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (user.role !== "DEVELOPER") throw new TRPCError({ code: "FORBIDDEN" });
  if (!user.developer) throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, user, developer: user.developer } });
});

// Requires developer.subscriptionTier === 'pro'
export const requirePro = t.middleware(async ({ ctx, next }) => {
  // Cast: this middleware is always composed after enforceDeveloper
  const developer = (ctx as typeof ctx & { developer: { subscriptionTier: string } }).developer;
  if (!developer || developer.subscriptionTier !== "pro") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature requires a Pro subscription.",
    });
  }
  return next({ ctx });
});

// API key authentication for agent webhook endpoints
const enforceApiKey = t.middleware(async ({ ctx, next }) => {
  const apiKey = ctx.headers.get("x-api-key");
  if (!apiKey) throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing X-Api-Key header" });

  // Find agent by doing bcrypt comparison — no plaintext stored
  const agents = await db.agent.findMany({ where: { isActive: true } });
  let matchedAgent = null;
  for (const agent of agents) {
    if (await compare(apiKey, agent.apiKey)) {
      matchedAgent = agent;
      break;
    }
  }
  if (!matchedAgent) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid API key" });

  return next({ ctx: { ...ctx, agent: matchedAgent } });
});

// ---------------------------------------------------------------------------
// Procedures
// ---------------------------------------------------------------------------

export const publicProcedure = t.procedure.use(timingMiddleware);
export const protectedProcedure = t.procedure.use(timingMiddleware).use(enforceAuth);
export const companyProcedure = t.procedure.use(timingMiddleware).use(enforceCompany);
export const developerProcedure = t.procedure.use(timingMiddleware).use(enforceDeveloper);
export const agentApiProcedure = t.procedure.use(timingMiddleware).use(enforceApiKey);
