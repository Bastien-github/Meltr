import { createHmac, createHash } from "crypto";
import { TRPCError } from "@trpc/server";
import { env } from "~/env.js";
import { db } from "~/server/db.js";
import { S3ExportService } from "./s3-export.js";
import { OracleQueue } from "~/server/queue/queues.js";

export interface OracleResultInput {
  taskRunId: string;
  agentId: string;
  contestId: string;
  tokensUsed: number;
  qualityScore: number;
  durationMs: number;
}

export class OracleService {
  static sign(input: OracleResultInput & { timestamp: string }): string {
    const payload = [
      input.agentId,
      input.contestId,
      input.tokensUsed,
      input.qualityScore,
      input.durationMs,
      input.timestamp,
    ].join(":");

    const inputHash = createHash("sha256").update(payload).digest("hex");
    console.log(`[Oracle] signing inputHash=${inputHash}`);

    return createHmac("sha256", env.ORACLE_HMAC_SECRET).update(payload).digest("hex");
  }

  static verify(hash: string, input: OracleResultInput & { timestamp: string }): boolean {
    const expected = this.sign(input);
    return hash === expected;
  }

  static async write(input: OracleResultInput, idempotencyKey: string) {
    // Check existing row with this idempotency key
    const existing = await db.oracleResult.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      // Same key + same data → idempotent success
      const dataMatches =
        existing.agentId === input.agentId &&
        existing.contestId === input.contestId &&
        existing.tokensUsed === input.tokensUsed &&
        existing.qualityScore === input.qualityScore &&
        existing.durationMs === input.durationMs;

      if (!dataMatches) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Oracle idempotency conflict: key=${idempotencyKey} already exists with different data`,
        });
      }

      console.log(`[Oracle] idempotent return for key=${idempotencyKey}`);
      return existing;
    }

    const timestamp = new Date().toISOString();
    const hash = this.sign({ ...input, timestamp });

    const result = await db.oracleResult.create({
      data: {
        ...input,
        hash,
        idempotencyKey,
        signedAt: new Date(timestamp),
        exportedToS3: false,
      },
    });

    console.log(`[Oracle] wrote result id=${result.id} hash=${hash}`);

    // Enqueue S3 export and chain write (non-blocking)
    await Promise.all([
      OracleQueue.add("s3-export", { oracleResultId: result.id, action: "s3-export" }),
      OracleQueue.add("chain-write", { oracleResultId: result.id, action: "chain-write" }),
    ]);

    return result;
  }

  static async export(resultId: string): Promise<object> {
    const result = await db.oracleResult.findUniqueOrThrow({ where: { id: resultId } });
    return {
      id: result.id,
      agentId: result.agentId,
      contestId: result.contestId,
      tokensUsed: result.tokensUsed,
      qualityScore: result.qualityScore,
      durationMs: result.durationMs,
      hash: result.hash,
      idempotencyKey: result.idempotencyKey,
      onChainTxHash: result.onChainTxHash,
      signedAt: result.signedAt,
      _verificationNote: "See /docs/oracle.md for independent verification instructions",
    };
  }
}
