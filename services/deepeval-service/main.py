"""
Meltr DeepEval microservice.

POST /evaluate  — runs GEval (rubric-aligned) + AnswerRelevancy against an agent output.
GET  /health    — liveness probe.

Env vars:
  ANTHROPIC_API_KEY   (required) — used as the judge LLM
  DEEPEVAL_MODEL      (optional) — Anthropic model for evaluation, default claude-haiku-4-5-20251001
"""

import asyncio
import os
from typing import Optional

from anthropic import Anthropic
from deepeval.models.base_model import DeepEvalBaseLLM
from deepeval.metrics import GEval, AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Anthropic adapter for DeepEval
# ---------------------------------------------------------------------------

class AnthropicJudge(DeepEvalBaseLLM):
    """Thin wrapper so DeepEval metrics use Anthropic Claude as the judge LLM."""

    def __init__(self, model_name: str):
        self.model_name = model_name
        self._client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    def load_model(self):
        return self._client

    def generate(self, prompt: str, schema: Optional[type] = None) -> str:
        msg = self._client.messages.create(
            model=self.model_name,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text

    async def a_generate(self, prompt: str, schema: Optional[type] = None) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate, prompt)

    def get_model_name(self) -> str:
        return self.model_name


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="Meltr DeepEval Service")

_MODEL_NAME = os.environ.get("DEEPEVAL_MODEL", "claude-haiku-4-5-20251001")
_judge = AnthropicJudge(_MODEL_NAME)


class EvaluateRequest(BaseModel):
    task: str
    output: str
    rubric: str


class EvaluateResponse(BaseModel):
    geval_score: float           # 0–1, rubric alignment via GEval
    answer_relevancy: float      # 0–1, output relevancy to task


@app.get("/health")
def health():
    return {"status": "ok", "model": _MODEL_NAME}


@app.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(req: EvaluateRequest):
    if not req.task.strip() or not req.output.strip():
        raise HTTPException(status_code=422, detail="task and output must not be empty")

    test_case = LLMTestCase(input=req.task, actual_output=req.output)

    geval = GEval(
        name="RubricAlignment",
        criteria=req.rubric if req.rubric.strip() else "Evaluate how well the output addresses the task.",
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        model=_judge,
        threshold=0.0,
    )

    relevancy = AnswerRelevancyMetric(
        model=_judge,
        threshold=0.0,
    )

    await asyncio.gather(
        geval.a_measure(test_case, _show_indicator=False),
        relevancy.a_measure(test_case, _show_indicator=False),
    )

    return EvaluateResponse(
        geval_score=round(float(geval.score), 4),
        answer_relevancy=round(float(relevancy.score), 4),
    )
