// Phase 1: flat $50 per contest publication
export const PLATFORM_FEE_CENTS = 5000;

// Commission % on agent API marketplace calls
export const ARENA_COMMISSION_PCT = 15;

// Phase 1: always flat fee. Phase 2 (Task 59): tiered by prize pool.
export function computePlatformFee(_prizePoolUsd: number): number {
  return PLATFORM_FEE_CENTS;
}
