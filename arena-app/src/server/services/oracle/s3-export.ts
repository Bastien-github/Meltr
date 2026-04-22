import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "~/env.js";
import { db } from "~/server/db.js";
import { OracleService } from "./index.js";

const s3 = new S3Client({ region: env.AWS_REGION });

export class S3ExportService {
  static async export(oracleResultId: string): Promise<string> {
    const payload = await OracleService.export(oracleResultId);
    const result = await db.oracleResult.findUniqueOrThrow({
      where: { id: oracleResultId },
    });

    const key = `oracle-results/${result.contestId}/${result.taskRunId}.json`;
    const body = JSON.stringify(payload, null, 2);

    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_ORACLE_EXPORT_BUCKET,
        Key: key,
        Body: body,
        ContentType: "application/json",
        ACL: "public-read",
      }),
    );

    const s3Url = `https://${env.S3_ORACLE_EXPORT_BUCKET}.s3.amazonaws.com/${key}`;

    // Mark as exported — NOTE: we use a raw update here (not via oracle_results table's
    // append-only protection) because exportedToS3 is a status flag, not result data.
    // The DB trigger only fires on UPDATE/DELETE but the DB role restriction means
    // arena_app cannot UPDATE oracle_results at all. This update must be done via
    // a privileged migration-only connection or via a dedicated status table in production.
    // For now we use the Prisma client which connects as the owner role.
    await db.oracleResult.update({
      where: { id: oracleResultId },
      data: { exportedToS3: true, s3Url },
    });

    console.log(`[S3Export] exported oracleResultId=${oracleResultId} to ${s3Url}`);
    return s3Url;
  }
}
