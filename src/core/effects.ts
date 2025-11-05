import type { Profile, Lags, Effect, ScheduledEffect } from '../types';

/**
 * Calculate the profile factor for a given month in the effect window
 */
export function calculateProfileFactor(
  profile: Profile,
  lags: Lags,
  monthsSinceApplied: number
): number {
  const { start, ramp, duration } = lags;

  // Check if we're in the effect window
  const effectStart = start;
  const effectEnd = start + ramp + duration - 1;

  if (monthsSinceApplied < effectStart) {
    return 0; // Not started yet
  }

  if (monthsSinceApplied > effectEnd) {
    return 0; // Effect has ended
  }

  // Calculate position within the effect window
  const positionInWindow = monthsSinceApplied - start;

  switch (profile) {
    case 'step':
      // Immediate 100% at start, plateau for duration
      return 1.0;

    case 'linear':
      // Linear ramp from 0 to 100% over ramp period, then plateau
      if (positionInWindow < ramp) {
        return positionInWindow / ramp;
      }
      return 1.0;

    case 'sigmoid': {
      // Sigmoid curve: 1 / (1 + exp(-κ*(t - midpoint)))
      const midpoint = ramp / 2;
      const κ = 6 / ramp; // steepness
      const t = positionInWindow;
      return 1 / (1 + Math.exp(-κ * (t - midpoint)));
    }

    case 'exp': {
      // Exponential approach: 1 - exp(-t/τ)
      const τ = ramp / 3;
      const t = positionInWindow;
      return 1 - Math.exp(-t / τ);
    }

    default:
      return 1.0;
  }
}

/**
 * Calculate the delta to apply for an effect at a given month
 */
export function calculateEffectDelta(
  effect: Effect,
  lags: Lags,
  profile: Profile,
  monthsSinceApplied: number,
  riskDamp: number
): number {
  const profileFactor = calculateProfileFactor(profile, lags, monthsSinceApplied);

  if (profileFactor === 0) {
    return 0;
  }

  // Apply risk damping
  const dampedDelta = effect.delta * (1 - riskDamp);

  return dampedDelta * profileFactor;
}

/**
 * Calculate the interval bounds for an effect at a given month
 */
export function calculateEffectInterval(
  effect: Effect,
  lags: Lags,
  profile: Profile,
  monthsSinceApplied: number
): { min: number; max: number } {
  const profileFactor = calculateProfileFactor(profile, lags, monthsSinceApplied);

  return {
    min: effect.interval.min * profileFactor,
    max: effect.interval.max * profileFactor,
  };
}

/**
 * Check if an effect is still active at a given month
 */
export function isEffectActive(lags: Lags, monthsSinceApplied: number): boolean {
  const effectEnd = lags.start + lags.ramp + lags.duration - 1;
  return monthsSinceApplied >= lags.start && monthsSinceApplied <= effectEnd;
}

/**
 * Get all active effects for the current month
 */
export function getActiveEffects(
  scheduledEffects: ScheduledEffect[],
  currentMonth: number
): ScheduledEffect[] {
  return scheduledEffects.filter(se => {
    const monthsSinceApplied = currentMonth - se.appliedAt;
    return isEffectActive(se.lags, monthsSinceApplied);
  });
}
