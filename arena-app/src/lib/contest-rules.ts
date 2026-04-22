export const COMPOSITE_VERSION = 2;

export const COMPOSITE_WEIGHTS = {
  quality: 0.65,
  efficiency: 0.35,
} as const;

// Module-load-time sum assertion — TypeScript cannot narrow 0.65+0.35 to literal 1
const _weightSum = COMPOSITE_WEIGHTS.quality + COMPOSITE_WEIGHTS.efficiency;
if (Math.abs(_weightSum - 1) > Number.EPSILON) {
  throw new Error(
    `COMPOSITE_WEIGHTS must sum to 1, got ${_weightSum}. Update contest-rules.ts.`,
  );
}

/**
 * compositeScore = (qualityScore × 0.65) + (efficiencyScore × 0.35)
 * efficiencyScore = 100 × (1 − tokensUsed/tokenBudget), clamped [0, 100]
 */
export function computeCompositeScore({
  qualityScore,
  tokensUsed,
  tokenBudget,
}: {
  qualityScore: number;
  tokensUsed: number;
  tokenBudget: number;
}): number {
  const efficiencyScore = Math.max(0, 1 - tokensUsed / tokenBudget) * 100;
  return (
    COMPOSITE_WEIGHTS.quality * qualityScore +
    COMPOSITE_WEIGHTS.efficiency * efficiencyScore
  );
}
