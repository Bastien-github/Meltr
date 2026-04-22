/**
 * Arena agent runner — executes inside ECS Fargate.
 *
 * Env vars injected by RunnerService.execute():
 *   TASK_ID, CONTEST_ID, TASK_DEFINITION, TOKEN_BUDGET, DEADLINE_UNIX,
 *   AGENT_WEBHOOK_URL (optional), AGENT_API_KEY (optional),
 *   MODEL_CONFIG (JSON), ANTHROPIC_API_KEY
 *
 * Writes /output/result.json on exit.
 * Exits 0 on success, 1 on failure.
 */

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const OUTPUT_PATH = "/output/result.json";

function writeResult(result) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
}

function die(reason, partial = {}) {
  const result = {
    success: false,
    error: reason,
    tokensUsed: partial.tokensUsed ?? 0,
    agentOutput: partial.agentOutput ?? "",
  };
  writeResult(result);
  console.error(`[Runner] Fatal: ${reason}`);
  process.exit(1);
}

function httpsPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on("error", reject);
    req.setTimeout(120_000, () => { req.destroy(new Error("HTTP timeout")); });
    req.write(data);
    req.end();
  });
}

async function main() {
  const {
    TASK_ID,
    CONTEST_ID,
    TASK_DEFINITION,
    TOKEN_BUDGET,
    DEADLINE_UNIX,
    AGENT_WEBHOOK_URL,
    AGENT_API_KEY,
    MODEL_CONFIG,
    ANTHROPIC_API_KEY,
  } = process.env;

  if (!TASK_ID) die("TASK_ID not set");
  if (!CONTEST_ID) die("CONTEST_ID not set");
  if (!TASK_DEFINITION) die("TASK_DEFINITION not set");
  if (!ANTHROPIC_API_KEY) die("ANTHROPIC_API_KEY not set");

  const tokenBudget = Number(TOKEN_BUDGET) || 50000;
  const deadlineUnix = Number(DEADLINE_UNIX) || Infinity;
  const modelConfig = MODEL_CONFIG ? JSON.parse(MODEL_CONFIG) : {};

  // Check deadline before we even start
  if (Date.now() / 1000 > deadlineUnix) {
    die("Deadline already passed before task started");
  }

  console.log(`[Runner] taskId=${TASK_ID} contestId=${CONTEST_ID} budget=${tokenBudget}`);

  let agentOutput = "";
  let tokensUsed = 0;

  if (AGENT_WEBHOOK_URL) {
    // Webhook mode: POST task to agent, expect { output: string }
    const resp = await httpsPost(
      AGENT_WEBHOOK_URL,
      { type: "task", taskId: TASK_ID, contestId: CONTEST_ID, task: TASK_DEFINITION, modelConfig },
      AGENT_API_KEY ? { Authorization: `Bearer ${AGENT_API_KEY}` } : {},
    ).catch((err) => die(`Webhook request failed: ${err.message}`));

    if (resp.status < 200 || resp.status >= 300) {
      die(`Webhook returned HTTP ${resp.status}: ${resp.body.slice(0, 200)}`);
    }

    let parsed;
    try {
      parsed = JSON.parse(resp.body);
    } catch {
      die(`Webhook response is not valid JSON: ${resp.body.slice(0, 200)}`);
    }

    if (typeof parsed.output !== "string") {
      die(`Webhook response missing 'output' string field`);
    }

    agentOutput = parsed.output;
    // Webhook agents self-report tokens — we still validate via Anthropic if they used us as proxy
    // For now, use reported value; runner enforces budget via token budget kill in RunnerService
    tokensUsed = typeof parsed.tokensUsed === "number" ? parsed.tokensUsed : 0;
  } else {
    // Direct Anthropic mode: runner calls Anthropic on behalf of agent
    const model = modelConfig.model ?? "claude-haiku-4-5-20251001";
    const maxTokens = Math.min(modelConfig.maxTokens ?? 4096, tokenBudget);

    const body = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: TASK_DEFINITION }],
    };

    const resp = await httpsPost(
      "https://api.anthropic.com/v1/messages",
      body,
      {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    ).catch((err) => die(`Anthropic API request failed: ${err.message}`));

    let parsed;
    try {
      parsed = JSON.parse(resp.body);
    } catch {
      die(`Anthropic response is not JSON: ${resp.body.slice(0, 200)}`);
    }

    if (parsed.error) {
      die(`Anthropic API error: ${parsed.error.message}`);
    }

    // CRITICAL: extract tokens from API response — never trust self-reported values
    const usage = parsed.usage;
    tokensUsed = (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0);

    const content = parsed.content?.[0];
    if (!content || content.type !== "text") {
      die("Anthropic returned no text content");
    }
    agentOutput = content.text;
  }

  if (tokensUsed > tokenBudget) {
    console.warn(`[Runner] token budget exceeded: used=${tokensUsed} budget=${tokenBudget}`);
    // RunnerService will have already killed via StopTask; this path handles graceful self-detection
  }

  writeResult({ success: true, agentOutput, tokensUsed });
  console.log(`[Runner] done taskId=${TASK_ID} tokensUsed=${tokensUsed}`);
  process.exit(0);
}

main().catch((err) => die(String(err)));
