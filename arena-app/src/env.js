import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Redis / BullMQ
    REDIS_URL: z.string().url(),

    // Anthropic
    ANTHROPIC_API_KEY: z.string().min(1),

    // Oracle
    ORACLE_HMAC_SECRET: z.string().min(32),

    // Blockchain
    BASE_RPC_URL: z.string().url(),
    PLATFORM_WALLET_ADDRESS: z.string().min(1),
    PLATFORM_WALLET_KEY_SECRET_ARN: z.string().min(1),
    CONTEST_RESULTS_CONTRACT: z.string().min(1),

    // Clerk
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_WEBHOOK_SECRET: z.string().min(1),

    // AWS
    AWS_REGION: z.string().min(1),
    ECS_CLUSTER_ARN: z.string().min(1),
    ECS_TASK_DEFINITION_ARN: z.string().min(1),
    S3_ORACLE_EXPORT_BUCKET: z.string().min(1),

    // Stripe
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_PRICE_PRO_MONTHLY: z.string().min(1),
    STRIPE_PRICE_PRO_ANNUAL: z.string().min(1),
  },

  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_URL: process.env.REDIS_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ORACLE_HMAC_SECRET: process.env.ORACLE_HMAC_SECRET,
    BASE_RPC_URL: process.env.BASE_RPC_URL,
    PLATFORM_WALLET_ADDRESS: process.env.PLATFORM_WALLET_ADDRESS,
    PLATFORM_WALLET_KEY_SECRET_ARN: process.env.PLATFORM_WALLET_KEY_SECRET_ARN,
    CONTEST_RESULTS_CONTRACT: process.env.CONTEST_RESULTS_CONTRACT,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    AWS_REGION: process.env.AWS_REGION,
    ECS_CLUSTER_ARN: process.env.ECS_CLUSTER_ARN,
    ECS_TASK_DEFINITION_ARN: process.env.ECS_TASK_DEFINITION_ARN,
    S3_ORACLE_EXPORT_BUCKET: process.env.S3_ORACLE_EXPORT_BUCKET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
    STRIPE_PRICE_PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
