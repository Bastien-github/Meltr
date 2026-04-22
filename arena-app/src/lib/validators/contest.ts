import { z } from "zod";

export const CreateContestInput = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  taskDefinition: z.string().max(50000).optional(),
  tokenBudget: z.number().int().min(1000),
  deadline: z.date().optional(),
  scheduledStartAt: z.date().optional(),
  rubric: z.string().max(50000).optional(),
  judgeModelVersion: z.string().min(1),
  category: z.array(z.string()).max(3).default([]),
  taskVisibility: z.enum(["ON_OPEN", "ON_LOCK", "ON_RUN"]).default("ON_OPEN"),
  prizePool: z
    .object({
      first: z.number().nonnegative().optional(),
      second: z.number().nonnegative().optional(),
      third: z.number().nonnegative().optional(),
      currency: z.enum(["USD", "CREDITS"]).default("USD"),
    })
    .optional(),
});

export const UpdateContestInput = CreateContestInput.partial().extend({
  id: z.string().cuid(),
});

export const TestRubricInput = z.object({
  contestId: z.string().cuid(),
  rubric: z.string().min(1).max(50000),
  sampleOutput: z.string().min(1).max(10000),
});
