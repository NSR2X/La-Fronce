import { describe, it, expect } from 'vitest';
import {
  evaluateCheck,
  evaluateObjective,
  checkMidGameCheckpoint,
  checkTroikaDefeat,
  checkVictory,
  getTroikaWarningLevel,
} from '../victory';
import type { GameState, Objective, ObjectiveCheck, KPI } from '../../types';

describe('Victory Conditions', () => {
  const baseKPI: KPI = {
    kpiId: 'test_kpi',
    label: 'Test KPI',
    unit: '%',
    ministry: 'Intérieur',
    category: 'economy',
    history: [
      { month: 0, value: 50 },
      { month: 1, value: 55 },
      { month: 2, value: 60 },
      { month: 3, value: 65 },
    ],
  };

  describe('evaluateCheck', () => {
    it('should evaluate >= comparator with last method', () => {
      const check: ObjectiveCheck = {
        kpiId: 'test_kpi',
        comparator: '>=',
        value: 60,
      };

      const passed = evaluateCheck(check, baseKPI, 4, 'last');
      expect(passed).toBe(true); // Last value is 65
    });

    it('should evaluate <= comparator with last method', () => {
      const check: ObjectiveCheck = {
        kpiId: 'test_kpi',
        comparator: '<=',
        value: 60,
      };

      const passed = evaluateCheck(check, baseKPI, 4, 'last');
      expect(passed).toBe(false); // Last value is 65 > 60
    });

    it('should evaluate with avg method', () => {
      const check: ObjectiveCheck = {
        kpiId: 'test_kpi',
        comparator: '>=',
        value: 55,
      };

      // Average of [50, 55, 60, 65] = 57.5
      const passed = evaluateCheck(check, baseKPI, 4, 'avg');
      expect(passed).toBe(true);
    });

    it('should evaluate trend_up comparator', () => {
      const check: ObjectiveCheck = {
        kpiId: 'test_kpi',
        comparator: 'trend_up',
      };

      const passed = evaluateCheck(check, baseKPI, 4, 'trend');
      expect(passed).toBe(true); // Trend is positive
    });
  });

  describe('evaluateObjective', () => {
    it('should calculate objective progress correctly', () => {
      const objective: Objective = {
        objectiveId: 'test_obj',
        label: 'Test Objective',
        description: 'Test',
        checks: [
          { kpiId: 'test_kpi', comparator: '>=', value: 60 },
          { kpiId: 'test_kpi', comparator: '>=', value: 70 },
        ],
        evaluationWindow: { months: 4, method: 'last' },
        difficultyTargets: {
          easy: { requiredCount: 1 },
          normal: { requiredCount: 2 },
          hard: { requiredCount: 2 },
        },
      };

      const progress = evaluateObjective(objective, [baseKPI], 'easy');
      expect(progress.objectiveId).toBe('test_obj');
      expect(progress.checksStatus.length).toBe(2);
      expect(progress.checksStatus[0].passed).toBe(true); // 65 >= 60
      expect(progress.checksStatus[1].passed).toBe(false); // 65 < 70
      expect(progress.overallPassed).toBe(true); // 1 passed >= requiredCount(1)
      expect(progress.progressPct).toBe(50); // 1 of 2 checks passed
    });
  });

  describe('checkTroikaDefeat', () => {
    const baseGameState: GameState = {
      saveId: 'test',
      currentMonth: 0,
      startDate: '2025-01',
      status: 'ongoing',
      seed: 12345,
      difficulty: {
        level: 'normal',
        objectiveSelection: { choose: 3, mustComplete: 2, midCheckpointMin: 1 },
        troikaThresholds: {
          deficitPct: -3,
          debtPct: 120,
          cmMin: 30,
          interestToRevenuePct: 15,
        },
      },
      selectedObjectives: [],
      objectives: [],
      kpis: [],
      cards: [],
      playedCards: [],
      scheduledEffects: [],
      budget: {
        revenue: 100,
        spending: 100,
        debt: 100,
        gdp: 100,
        plannedByMinistry: [],
        executedByMinistry: [],
      },
      counters: {
        ts: 50,
        cm: 50,
        leg: 50,
        rj: 0,
        cp: 100,
      },
    };

    it('should detect defeat when deficit exceeds threshold', () => {
      const gameState = {
        ...baseGameState,
        budget: {
          ...baseGameState.budget,
          revenue: 100,
          spending: 105, // 5% deficit > 3% threshold
          gdp: 100,
        },
      };

      const result = checkTroikaDefeat(gameState);
      expect(result.defeated).toBe(true);
      expect(result.reason).toContain('Déficit');
    });

    it('should detect defeat when debt+CM conditions met', () => {
      const gameState = {
        ...baseGameState,
        budget: {
          ...baseGameState.budget,
          debt: 130, // 130% debt > 120% threshold
          gdp: 100,
        },
        counters: {
          ...baseGameState.counters,
          cm: 25, // < 30 threshold
        },
      };

      const result = checkTroikaDefeat(gameState);
      expect(result.defeated).toBe(true);
      expect(result.reason).toContain('Dette');
    });

    it('should detect defeat when interest payments too high', () => {
      const gameState = {
        ...baseGameState,
        budget: {
          ...baseGameState.budget,
          debt: 600, // Interest = 600 * 3% = 18
          revenue: 100, // 18/100 = 18% > 15% threshold
          gdp: 100,
        },
      };

      const result = checkTroikaDefeat(gameState);
      expect(result.defeated).toBe(true);
      expect(result.reason).toContain('Intérêts');
    });

    it('should not detect defeat when all conditions are safe', () => {
      const result = checkTroikaDefeat(baseGameState);
      expect(result.defeated).toBe(false);
    });
  });

  describe('checkVictory', () => {
    it('should detect victory when enough objectives completed', () => {
      const objective: Objective = {
        objectiveId: 'obj1',
        label: 'Test Objective',
        description: 'Test',
        checks: [
          { kpiId: 'test_kpi', comparator: '>=', value: 60 },
        ],
        evaluationWindow: { months: 4, method: 'last' },
        difficultyTargets: {
          easy: { requiredCount: 1 },
          normal: { requiredCount: 1 },
          hard: { requiredCount: 1 },
        },
      };

      const gameState: GameState = {
        saveId: 'test',
        currentMonth: 36,
        startDate: '2025-01',
        status: 'ongoing',
        seed: 12345,
        difficulty: {
          level: 'normal',
          objectiveSelection: { choose: 1, mustComplete: 1, midCheckpointMin: 1 },
          troikaThresholds: {
            deficitPct: -3,
            debtPct: 120,
            cmMin: 30,
            interestToRevenuePct: 15,
          },
        },
        selectedObjectives: ['obj1'],
        objectives: [objective],
        kpis: [baseKPI],
        cards: [],
        playedCards: [],
        scheduledEffects: [],
        budget: {
          revenue: 100,
          spending: 100,
          debt: 100,
          gdp: 100,
          plannedByMinistry: [],
          executedByMinistry: [],
        },
        counters: {
          ts: 50,
          cm: 50,
          leg: 50,
          rj: 0,
          cp: 100,
        },
      };

      const victory = checkVictory(gameState);
      expect(victory).toBe(true);
    });
  });

  describe('getTroikaWarningLevel', () => {
    const baseGameState: GameState = {
      saveId: 'test',
      currentMonth: 0,
      startDate: '2025-01',
      status: 'ongoing',
      seed: 12345,
      difficulty: {
        level: 'normal',
        objectiveSelection: { choose: 3, mustComplete: 2, midCheckpointMin: 1 },
        troikaThresholds: {
          deficitPct: -3,
          debtPct: 120,
          cmMin: 30,
          interestToRevenuePct: 15,
        },
      },
      selectedObjectives: [],
      objectives: [],
      kpis: [],
      cards: [],
      playedCards: [],
      scheduledEffects: [],
      budget: {
        revenue: 100,
        spending: 100,
        debt: 60, // 60% debt ratio is well below 120% threshold
        gdp: 100,
        plannedByMinistry: [],
        executedByMinistry: [],
      },
      counters: {
        ts: 50,
        cm: 50,
        leg: 50,
        rj: 0,
        cp: 100,
      },
    };

    it('should return safe level (0) when all metrics are good', () => {
      const level = getTroikaWarningLevel(baseGameState);
      expect(level).toBe(0);
    });

    it('should return warning level (1) at 70% threshold', () => {
      const gameState = {
        ...baseGameState,
        budget: {
          ...baseGameState.budget,
          revenue: 100,
          spending: 102.15, // 2.15% deficit = 71.67% of 3% threshold
          debt: 60,
          gdp: 100,
        },
      };

      const level = getTroikaWarningLevel(gameState);
      expect(level).toBeGreaterThanOrEqual(1);
    });

    it('should return danger level (2) when threshold exceeded', () => {
      const gameState = {
        ...baseGameState,
        budget: {
          ...baseGameState.budget,
          spending: 105, // 5% deficit > 3% threshold
          gdp: 100,
        },
      };

      const level = getTroikaWarningLevel(gameState);
      expect(level).toBe(2);
    });
  });
});
