import { describe, it, expect } from 'vitest';
import { calculateEffectDelta } from '../effects';
import type { Effect, Lags } from '../../types';

describe('Effects Engine', () => {
  const baseEffect: Effect = {
    kpiId: 'test_kpi',
    delta: 10,
    interval: { min: 8, max: 12 },
    confidence: 'high',
    profile: 'linear',
  };

  const baseLags: Lags = {
    start: 0,
    ramp: 3,
    duration: 6,
  };

  describe('calculateEffectDelta', () => {
    it('should return 0 before start lag', () => {
      const lags: Lags = { start: 2, ramp: 2, duration: 4 };
      const delta = calculateEffectDelta(baseEffect, lags, 'linear', 0, 0);
      expect(delta).toBe(0);

      const delta1 = calculateEffectDelta(baseEffect, lags, 'linear', 1, 0);
      expect(delta1).toBe(0);
    });

    it('should apply linear profile correctly', () => {
      const delta0 = calculateEffectDelta(baseEffect, baseLags, 'linear', 0, 0);
      expect(delta0).toBe(0); // Start of ramp

      const delta1 = calculateEffectDelta(baseEffect, baseLags, 'linear', 1, 0);
      expect(delta1).toBeCloseTo(3.33, 1); // 1/3 of ramp

      const delta2 = calculateEffectDelta(baseEffect, baseLags, 'linear', 2, 0);
      expect(delta2).toBeCloseTo(6.67, 1); // 2/3 of ramp

      const delta3 = calculateEffectDelta(baseEffect, baseLags, 'linear', 3, 0);
      expect(delta3).toBe(10); // Full delta at end of ramp
    });

    it('should apply step profile immediately', () => {
      const delta = calculateEffectDelta(baseEffect, baseLags, 'step', 0, 0);
      expect(delta).toBe(10); // Immediate full effect
    });

    it('should apply risk damp correctly', () => {
      const delta = calculateEffectDelta(baseEffect, baseLags, 'step', 0, 0.3);
      expect(delta).toBe(7); // 10 * (1 - 0.3) = 7
    });

    it('should return 0 after effect duration ends', () => {
      // Effect window: [0, 0+3+6-1] = [0, 8]
      const delta9 = calculateEffectDelta(baseEffect, baseLags, 'linear', 9, 0);
      expect(delta9).toBe(0); // After duration

      const delta10 = calculateEffectDelta(baseEffect, baseLags, 'linear', 10, 0);
      expect(delta10).toBe(0); // Well after duration
    });

    it('should handle sigmoid profile', () => {
      const delta0 = calculateEffectDelta(baseEffect, baseLags, 'sigmoid', 0, 0);
      expect(delta0).toBeGreaterThan(0); // Sigmoid starts slow
      expect(delta0).toBeLessThan(10);

      const delta3 = calculateEffectDelta(baseEffect, baseLags, 'sigmoid', 3, 0);
      expect(delta3).toBeCloseTo(10, 0); // Should be near full at end of ramp
    });

    it('should handle exp profile', () => {
      // Exponential approach: 1 - exp(-t/τ) starts at 0 when t=0
      const delta0 = calculateEffectDelta(baseEffect, baseLags, 'exp', 0, 0);
      expect(delta0).toBe(0);

      // At t=1, should have some progress
      const delta1 = calculateEffectDelta(baseEffect, baseLags, 'exp', 1, 0);
      expect(delta1).toBeGreaterThan(0);
      expect(delta1).toBeLessThan(10);

      const delta3 = calculateEffectDelta(baseEffect, baseLags, 'exp', 3, 0);
      expect(delta3).toBeCloseTo(10, 0);
    });
  });
});
