import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc.js";
import { publicRouter } from "~/server/api/routers/public.js";
import { companyRouter } from "~/server/api/routers/company.js";
import { developerRouter } from "~/server/api/routers/developer.js";
import { agentRouter } from "~/server/api/routers/agent.js";

export const appRouter = createTRPCRouter({
  public: publicRouter,
  company: companyRouter,
  developer: developerRouter,
  agent: agentRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
