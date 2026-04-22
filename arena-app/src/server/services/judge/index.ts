import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { env } from "~/env.js";
import { db } from "~/server/db.js";
import { formatJudgePrompt } from "./prompt.js";

interface JudgeResult {
  score: number;
  rationale: string;
}

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export class JudgeService {
  static async score({
    agentOutput,
    rubric,
    task,
    judgeModelVersion,
    contestId,
    isTest = false,
  }: {
    agentOutput: string;
    rubric: string;
    task: string;
    judgeModelVersion: string; // NEVER use 'latest' — always from Contest.judgeModelVersion
    contestId?: string;
    isTest?: boolean;
  }): Promise<JudgeResult> {
    const startMs = Date.now();
    const prompt = formatJudgePrompt({ rubric, task, agentOutput });
    const inputHash = createHash("sha256")
      .update(agentOutput + rubric)
      .digest("hex");

    const response = await client.messages.create({
      model: judgeModelVersion, // pinned from contest — never hardcoded
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0];
    if (!raw || raw.type !== "text") {
      throw new Error("[Judge] Anthropic returned no text content");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.text.trim());
    } catch {
      throw new Error(`[Judge] Could not parse JSON from response: ${raw.text.slice(0, 200)}`);
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).score !== "number" ||
      typeof (parsed as Record<string, unknown>).rationale !== "string"
    ) {
      throw new Error(`[Judge] Response schema invalid: ${JSON.stringify(parsed)}`);
    }

    const { score, rationale } = parsed as { score: number; rationale: string };

    if (score < 0 || score > 100) {
      throw new Error(`[Judge] Score out of range: ${score}`);
    }
    if (rationale.length < 20) {
      throw new Error(`[Judge] Rationale too short (${rationale.length} chars): "${rationale}"`);
    }

    const durationMs = Date.now() - startMs;

    // Log every call — input hash only, never the secret or raw output
    await db.judgeLog.create({
      data: {
        contestId: contestId ?? null,
        inputHash,
        judgeModelVersion,
        score,
        rationale,
        isTest,
        durationMs,
      },
    });

    console.log(
      `[Judge] scored ${score}/100 model=${judgeModelVersion} inputHash=${inputHash} isTest=${isTest}`,
    );

    return { score, rationale };
  }
}
