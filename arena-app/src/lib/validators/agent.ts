import { z } from "zod";

export const RegisterAgentInput = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  webhookUrl: z.string().url().optional(),
  modelConfig: z
    .object({
      model: z.string().min(1),
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().int().min(1).optional(),
    })
    .optional(),
  category: z.array(z.string()).max(5).default([]),
});

export const UpdateAgentInput = RegisterAgentInput.partial().extend({
  id: z.string().cuid(),
});

export const EnterContestInput = z.object({
  contestId: z.string().cuid(),
  agentId: z.string().cuid(),
});

export const SubmitTaskResultInput = z.object({
  taskRunId: z.string().cuid(),
  output: z.string().min(1),
  // Tokens are extracted server-side from Anthropic API — never trust this field
  // This is included only for debug metadata, NOT used in oracle calculation
  _debugTokensHint: z.number().int().nonnegative().optional(),
});
