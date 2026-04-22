// Placeholder router — replaced by public/company/developer/agent routers in R-06.
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => ({ greeting: `Hello ${input.text}` })),
});
