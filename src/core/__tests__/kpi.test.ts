import { describe, it, expect } from 'vitest';
import { normalizeKPI, getCurrentValue, addMonths, calculateTrend } from '../kpi';
import type { KPI } from '../../types';

describe('KPI Functions', () => {
  const mockKPI: KPI = {
    kpiId: 'test_kpi',
    ministry: 'EconomyFinance',
    label: 'Test KPI',
    unit: '%',
    direction: 'increase_good',
    bounds: { min: 0, max: 100 },
    history: [
      { date: '2025-01', value: 50 },
      { date: '2025-02', value: 60 },
      { date: '2025-03', value: 70 },
    ],
    weightInIPM: 0.5,
    source: { name: 'Test Source' },
    lastUpdated: '2025-03',
  };

  describe('normalizeKPI', () => {
    it('should normalize increase_good KPI correctly', () => {
      const result = normalizeKPI(50, mockKPI);
      expect(result).toBe(0.5);
    });

    it('should normalize decrease_good KPI correctly', () => {
      const kpi = { ...mockKPI, direction: 'decrease_good' as const };
      const result = normalizeKPI(50, kpi);
      expect(result).toBe(0.5);
    });

    it('should clamp values to 0..1', () => {
      expect(normalizeKPI(-10, mockKPI)).toBe(0);
      expect(normalizeKPI(150, mockKPI)).toBe(1);
    });
  });

  describe('getCurrentValue', () => {
    it('should return the last history value', () => {
      const result = getCurrentValue(mockKPI);
      expect(result).toBe(70);
    });
  });

  describe('addMonths', () => {
    it('should add months correctly', () => {
      expect(addMonths('2025-01', 1)).toBe('2025-02');
      expect(addMonths('2025-12', 1)).toBe('2026-01');
      expect(addMonths('2025-01', 12)).toBe('2026-01');
    });
  });

  describe('calculateTrend', () => {
    it('should calculate positive trend', () => {
      const values = [10, 20, 30, 40, 50];
      const trend = calculateTrend(values);
      expect(trend).toBeGreaterThan(0);
    });

    it('should calculate negative trend', () => {
      const values = [50, 40, 30, 20, 10];
      const trend = calculateTrend(values);
      expect(trend).toBeLessThan(0);
    });

    it('should return 0 for flat trend', () => {
      const values = [50, 50, 50, 50, 50];
      const trend = calculateTrend(values);
      expect(trend).toBe(0);
    });
  });
});
