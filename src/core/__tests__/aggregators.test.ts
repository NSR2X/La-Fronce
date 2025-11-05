import { describe, it, expect } from 'vitest';
import { calculateIPM, calculateRiskDamp, clamp } from '../aggregators';
import type { KPI } from '../../types';

describe('Aggregators', () => {
  const mockKPIs: KPI[] = [
    {
      kpiId: 'kpi1',
      ministry: 'EconomyFinance',
      label: 'KPI 1',
      unit: '%',
      direction: 'increase_good',
      bounds: { min: 0, max: 100 },
      history: [{ date: '2025-01', value: 50 }],
      weightInIPM: 0.5,
      source: { name: 'Test' },
      lastUpdated: '2025-01',
    },
    {
      kpiId: 'kpi2',
      ministry: 'EconomyFinance',
      label: 'KPI 2',
      unit: '%',
      direction: 'increase_good',
      bounds: { min: 0, max: 100 },
      history: [{ date: '2025-01', value: 100 }],
      weightInIPM: 0.5,
      source: { name: 'Test' },
      lastUpdated: '2025-01',
    },
  ];

  describe('calculateIPM', () => {
    it('should calculate IPM correctly', () => {
      const ipm = calculateIPM('EconomyFinance', mockKPIs);
      expect(ipm).toBe(75); // (0.5*0.5 + 1.0*0.5) / 1.0 * 100 = 75
    });

    it('should return 50 for unknown ministry', () => {
      const ipm = calculateIPM('Defense', mockKPIs);
      expect(ipm).toBe(50);
    });
  });

  describe('clamp', () => {
    it('should clamp values correctly', () => {
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(50, 0, 100)).toBe(50);
    });
  });

  describe('calculateRiskDamp', () => {
    it('should calculate risk damp correctly', () => {
      const riskDamp = calculateRiskDamp(50, 50, 50);
      expect(riskDamp).toBeGreaterThanOrEqual(0);
      expect(riskDamp).toBeLessThanOrEqual(0.5);
    });

    it('should return 0 for low risk', () => {
      const riskDamp = calculateRiskDamp(0, 0, 100);
      expect(riskDamp).toBeLessThanOrEqual(0);
    });
  });
});
