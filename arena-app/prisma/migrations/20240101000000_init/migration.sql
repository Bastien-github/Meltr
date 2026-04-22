-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COMPANY', 'DEVELOPER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'pro');

-- CreateEnum
CREATE TYPE "ContestStatus" AS ENUM ('DRAFT', 'OPEN', 'LOCKED', 'RUNNING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "TaskVisibility" AS ENUM ('ON_OPEN', 'ON_LOCK', 'ON_RUN');

-- CreateEnum
CREATE TYPE "AgentApiCallStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DEVELOPER',
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stripeCustomerId" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "webhookUrl" TEXT,
    "apiKey" TEXT NOT NULL,
    "modelConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "apiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pricePerCallCents" INTEGER,
    "marketConfidenceScore" DOUBLE PRECISION,
    "category" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "taskDefinition" TEXT,
    "tokenBudget" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3),
    "scheduledStartAt" TIMESTAMP(3),
    "rubric" TEXT,
    "judgeModelVersion" TEXT NOT NULL DEFAULT 'claude-opus-4-5',
    "status" "ContestStatus" NOT NULL DEFAULT 'DRAFT',
    "prizePool" JSONB,
    "category" TEXT[],
    "taskVisibility" "TaskVisibility" NOT NULL DEFAULT 'ON_OPEN',
    "stripePaymentIntentId" TEXT,
    "platformFeeUsd" DOUBLE PRECISION,
    "maxConcurrency" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_entries" (
    "contestId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "healthCheckPassed" BOOLEAN,
    "healthCheckAt" TIMESTAMP(3),
    "healthCheckError" TEXT,

    CONSTRAINT "contest_entries_pkey" PRIMARY KEY ("contestId","agentId")
);

-- CreateTable
CREATE TABLE "task_runs" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "qualityScore" DOUBLE PRECISION,
    "durationMs" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "task_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oracle_results" (
    "id" TEXT NOT NULL,
    "taskRunId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "onChainTxHash" TEXT,
    "exportedToS3" BOOLEAN NOT NULL DEFAULT false,
    "s3Url" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oracle_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_scores" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "efficiencyScore" DOUBLE PRECISION NOT NULL,
    "consistencyScore" DOUBLE PRECISION,
    "compositeScore" DOUBLE PRECISION NOT NULL,
    "compositeVersion" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_state_logs" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "fromStatus" "ContestStatus",
    "toStatus" "ContestStatus" NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "contest_state_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "taskDefinition" TEXT NOT NULL,
    "rubric" TEXT NOT NULL,
    "tokenBudget" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "category" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmark_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_api_calls" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "AgentApiCallStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "oracleResultId" TEXT,
    "tokensUsed" INTEGER,
    "qualityScore" DOUBLE PRECISION,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_api_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judge_logs" (
    "id" TEXT NOT NULL,
    "contestId" TEXT,
    "inputHash" TEXT NOT NULL,
    "judgeModelVersion" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT NOT NULL,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "judge_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_userId_key" ON "companies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "developers_userId_key" ON "developers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agents_slug_key" ON "agents"("slug");

-- CreateIndex
CREATE INDEX "agents_developerId_idx" ON "agents"("developerId");

-- CreateIndex
CREATE INDEX "agents_slug_idx" ON "agents"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "contests_slug_key" ON "contests"("slug");

-- CreateIndex
CREATE INDEX "contests_companyId_idx" ON "contests"("companyId");

-- CreateIndex
CREATE INDEX "contests_status_idx" ON "contests"("status");

-- CreateIndex
CREATE INDEX "contests_slug_idx" ON "contests"("slug");

-- CreateIndex
CREATE INDEX "contests_scheduledStartAt_idx" ON "contests"("scheduledStartAt");

-- CreateIndex
CREATE INDEX "contest_entries_contestId_idx" ON "contest_entries"("contestId");

-- CreateIndex
CREATE INDEX "contest_entries_agentId_idx" ON "contest_entries"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "task_runs_idempotencyKey_key" ON "task_runs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "task_runs_contestId_idx" ON "task_runs"("contestId");

-- CreateIndex
CREATE INDEX "task_runs_agentId_idx" ON "task_runs"("agentId");

-- CreateIndex
CREATE INDEX "task_runs_contestId_qualityScore_idx" ON "task_runs"("contestId", "qualityScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "oracle_results_taskRunId_key" ON "oracle_results"("taskRunId");

-- CreateIndex
CREATE UNIQUE INDEX "oracle_results_hash_key" ON "oracle_results"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "oracle_results_idempotencyKey_key" ON "oracle_results"("idempotencyKey");

-- CreateIndex
CREATE INDEX "oracle_results_contestId_idx" ON "oracle_results"("contestId");

-- CreateIndex
CREATE INDEX "oracle_results_agentId_idx" ON "oracle_results"("agentId");

-- CreateIndex
CREATE INDEX "leaderboard_scores_agentId_idx" ON "leaderboard_scores"("agentId");

-- CreateIndex
CREATE INDEX "leaderboard_scores_contestId_idx" ON "leaderboard_scores"("contestId");

-- CreateIndex
CREATE INDEX "leaderboard_scores_compositeScore_idx" ON "leaderboard_scores"("compositeScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_scores_agentId_contestId_compositeVersion_key" ON "leaderboard_scores"("agentId", "contestId", "compositeVersion");

-- CreateIndex
CREATE INDEX "contest_state_logs_contestId_idx" ON "contest_state_logs"("contestId");

-- CreateIndex
CREATE UNIQUE INDEX "benchmark_templates_slug_key" ON "benchmark_templates"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "agent_api_calls_oracleResultId_key" ON "agent_api_calls"("oracleResultId");

-- CreateIndex
CREATE INDEX "agent_api_calls_agentId_idx" ON "agent_api_calls"("agentId");

-- CreateIndex
CREATE INDEX "agent_api_calls_companyId_idx" ON "agent_api_calls"("companyId");

-- CreateIndex
CREATE INDEX "judge_logs_contestId_idx" ON "judge_logs"("contestId");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developers" ADD CONSTRAINT "developers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "developers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contests" ADD CONSTRAINT "contests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_entries" ADD CONSTRAINT "contest_entries_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_entries" ADD CONSTRAINT "contest_entries_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_runs" ADD CONSTRAINT "task_runs_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_runs" ADD CONSTRAINT "task_runs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oracle_results" ADD CONSTRAINT "oracle_results_taskRunId_fkey" FOREIGN KEY ("taskRunId") REFERENCES "task_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oracle_results" ADD CONSTRAINT "oracle_results_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oracle_results" ADD CONSTRAINT "oracle_results_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_scores" ADD CONSTRAINT "leaderboard_scores_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_scores" ADD CONSTRAINT "leaderboard_scores_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_state_logs" ADD CONSTRAINT "contest_state_logs_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_api_calls" ADD CONSTRAINT "agent_api_calls_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_api_calls" ADD CONSTRAINT "agent_api_calls_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_api_calls" ADD CONSTRAINT "agent_api_calls_oracleResultId_fkey" FOREIGN KEY ("oracleResultId") REFERENCES "oracle_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_logs" ADD CONSTRAINT "judge_logs_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

