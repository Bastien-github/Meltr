/**
 * Client for the Meltr DeepEval microservice.
 *
 * Returns null (never throws) when the service is unconfigured or unreachable
 * so it can be safely run in parallel with JudgeService without blocking oracle writes.
 */

const SERVICE_URL = process.env.DEEPEVAL_SERVICE_URL;
const TIMEOUT_MS = 45_000;

export interface DeepEvalScores {
  gevalScore: number;       // 0–1, rubric alignment
  answerRelevancy: number;  // 0–1, output relevancy to task
}

export interface DeepEvalInput {
  task: string;
  output: string;
  rubric: string;
}

export class DeepEvalService {
  static get isEnabled(): boolean {
    return !!SERVICE_URL;
  }

  static async evaluate(input: DeepEvalInput): Promise<DeepEvalScores | null> {
    if (!SERVICE_URL) return null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(`${SERVICE_URL}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: input.task,
          output: input.output,
          rubric: input.rubric,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      if (!res.ok) {
        console.error(`[DeepEval] service returned HTTP ${res.status}`);
        return null;
      }

      const data = await res.json() as { geval_score: number; answer_relevancy: number };
      return {
        gevalScore: data.geval_score,
        answerRelevancy: data.answer_relevancy,
      };
    } catch (err) {
      console.error("[DeepEval] evaluate failed:", err instanceof Error ? err.message : String(err));
      return null;
    }
  }
}
