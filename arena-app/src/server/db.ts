import { env } from "~/env.js";
import { PrismaClient, type OracleResult } from "../../generated/prisma/index.js";
export { ContestStatus } from "../../generated/prisma/index.js";
export type { OracleResult };

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
