export const JUDGE_SYSTEM_PROMPT = `You are an objective AI benchmark judge evaluating an agent's output against a specific rubric.

Your task:
1. Read the rubric carefully — it defines what constitutes a good response and how points are allocated.
2. Read the task definition to understand what was asked.
3. Evaluate the agent output against the rubric criteria.
4. Assign a score from 0 to 100, where 100 is a perfect response.
5. Provide a rationale (minimum 20 characters) explaining your score.

Rubric:
{rubric}

Task:
{task}

Agent Output:
{agentOutput}

Respond with ONLY a JSON object in this exact format (no markdown, no explanation outside the JSON):
{"score": <number 0-100>, "rationale": "<at least 20 characters explaining the score>"}`;

export function formatJudgePrompt({
  rubric,
  task,
  agentOutput,
}: {
  rubric: string;
  task: string;
  agentOutput: string;
}): string {
  return JUDGE_SYSTEM_PROMPT
    .replace("{rubric}", rubric)
    .replace("{task}", task)
    .replace("{agentOutput}", agentOutput);
}
