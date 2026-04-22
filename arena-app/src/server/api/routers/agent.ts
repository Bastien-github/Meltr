import { TRPCError } from "@trpc/server";
import { createTRPCRouter, agentApiProcedure } from "~/server/api/trpc.js";
import { SubmitTaskResultInput } from "~/lib/validators/agent.js";

export const agentRouter = createTRPCRouter({
  submitTaskResult: agentApiProcedure
    .input(SubmitTaskResultInput)
    .mutation(async ({ ctx, input }) => {
      const taskRun = await ctx.db.taskRun.findUnique({
        where: { id: input.taskRunId },
        include: { contest: true },
      });

      if (!taskRun) throw new TRPCError({ code: "NOT_FOUND" });
      if (taskRun.agentId !== ctx.agent.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (taskRun.completed) {
        throw new TRPCError({ code: "CONFLICT", message: "TaskRun already completed" });
      }

      // NOTE: tokens are extracted from Anthropic API response server-side (R-10).
      // The output is stored here; oracle signing happens in RunnerService.
      // This endpoint is for agent-push result delivery, not oracle finalization.

      // Full oracle flow implemented in R-10/R-12
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Full result submission pipeline pending R-10/R-12",
      });
    }),
});
