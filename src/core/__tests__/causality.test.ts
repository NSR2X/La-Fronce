import { describe, it, expect } from 'vitest';
import {
  applySynergies,
  applyAntagonisms,
  applyCausalityRules,
} from '../causality';
import type { SynergyRule, AntagonismRule, CardOption } from '../../types';

describe('Causality System', () => {
  const baseOption: CardOption = {
    label: 'Test Option',
    effects: [
      {
        kpiId: 'test_kpi',
        delta: 10,
        interval: { min: 8, max: 12 },
        confidence: 'high',
        profile: 'linear',
      },
    ],
    costs: { eur: 1, cp: 5, leg: 2 },
    lags: { start: 0, ramp: 3, duration: 6 },
  };

  describe('applySynergies', () => {
    it('should apply synergy multiplier when all cards are active', () => {
      const synergyRule: SynergyRule = {
        ruleId: 'SYN_Test',
        cards: ['CARD_A', 'CARD_B'],
        multiplier: 1.5,
      };

      const activeCards = ['CARD_A', 'CARD_B', 'CARD_C'];
      const result = applySynergies(activeCards, [synergyRule], baseOption);

      expect(result.appliedRules).toContain('SYN_Test');
      expect(result.modifiedOption.effects[0].delta).toBe(15); // 10 * 1.5
      expect(result.modifiedOption.effects[0].interval.min).toBe(12); // 8 * 1.5
      expect(result.modifiedOption.effects[0].interval.max).toBe(18); // 12 * 1.5
    });

    it('should not apply synergy when not all cards are active', () => {
      const synergyRule: SynergyRule = {
        ruleId: 'SYN_Test',
        cards: ['CARD_A', 'CARD_B'],
        multiplier: 1.5,
      };

      const activeCards = ['CARD_A', 'CARD_C']; // Missing CARD_B
      const result = applySynergies(activeCards, [synergyRule], baseOption);

      expect(result.appliedRules).toHaveLength(0);
      expect(result.modifiedOption.effects[0].delta).toBe(10); // Unchanged
    });

    it('should apply default multiplier (1.15) when not specified', () => {
      const synergyRule: SynergyRule = {
        ruleId: 'SYN_Default',
        cards: ['CARD_A'],
      };

      const activeCards = ['CARD_A'];
      const result = applySynergies(activeCards, [synergyRule], baseOption);

      expect(result.appliedRules).toContain('SYN_Default');
      expect(result.modifiedOption.effects[0].delta).toBe(11.5); // 10 * 1.15
    });

    it('should reduce ramp when rampReduction is specified', () => {
      const synergyRule: SynergyRule = {
        ruleId: 'SYN_FastRamp',
        cards: ['CARD_A'],
        multiplier: 1.2,
        rampReduction: 0.5, // 50% reduction
      };

      const activeCards = ['CARD_A'];
      const result = applySynergies(activeCards, [synergyRule], baseOption);

      expect(result.appliedRules).toContain('SYN_FastRamp');
      expect(result.modifiedOption.lags.ramp).toBe(1); // floor(3 * 0.5)
    });

    it('should apply multiple synergies cumulatively', () => {
      const synergyRules: SynergyRule[] = [
        {
          ruleId: 'SYN_A',
          cards: ['CARD_A'],
          multiplier: 1.5,
        },
        {
          ruleId: 'SYN_B',
          cards: ['CARD_B'],
          multiplier: 1.2,
        },
      ];

      const activeCards = ['CARD_A', 'CARD_B'];
      const result = applySynergies(activeCards, synergyRules, baseOption);

      expect(result.appliedRules).toHaveLength(2);
      expect(result.appliedRules).toContain('SYN_A');
      expect(result.appliedRules).toContain('SYN_B');
      expect(result.modifiedOption.effects[0].delta).toBe(18); // 10 * 1.5 * 1.2
    });
  });

  describe('applyAntagonisms', () => {
    it('should apply antagonism multiplier when all cards are active', () => {
      const antagonismRule: AntagonismRule = {
        ruleId: 'ANT_Test',
        cards: ['CARD_A', 'CARD_B'],
        multiplier: 0.5,
      };

      const activeCards = ['CARD_A', 'CARD_B'];
      const result = applyAntagonisms(activeCards, [antagonismRule], baseOption);

      expect(result.appliedRules).toContain('ANT_Test');
      expect(result.modifiedOption.effects[0].delta).toBe(5); // 10 * 0.5
      expect(result.modifiedOption.effects[0].interval.min).toBe(4); // 8 * 0.5
      expect(result.modifiedOption.effects[0].interval.max).toBe(6); // 12 * 0.5
    });

    it('should not apply antagonism when not all cards are active', () => {
      const antagonismRule: AntagonismRule = {
        ruleId: 'ANT_Test',
        cards: ['CARD_A', 'CARD_B'],
        multiplier: 0.5,
      };

      const activeCards = ['CARD_A', 'CARD_C']; // Missing CARD_B
      const result = applyAntagonisms(activeCards, [antagonismRule], baseOption);

      expect(result.appliedRules).toHaveLength(0);
      expect(result.modifiedOption.effects[0].delta).toBe(10); // Unchanged
    });

    it('should apply default multiplier (0.75) when not specified', () => {
      const antagonismRule: AntagonismRule = {
        ruleId: 'ANT_Default',
        cards: ['CARD_A'],
      };

      const activeCards = ['CARD_A'];
      const result = applyAntagonisms(activeCards, [antagonismRule], baseOption);

      expect(result.appliedRules).toContain('ANT_Default');
      expect(result.modifiedOption.effects[0].delta).toBe(7.5); // 10 * 0.75
    });

    it('should increase ramp when rampIncrease is specified', () => {
      const antagonismRule: AntagonismRule = {
        ruleId: 'ANT_SlowRamp',
        cards: ['CARD_A'],
        multiplier: 0.8,
        rampIncrease: 0.5, // 50% increase
      };

      const activeCards = ['CARD_A'];
      const result = applyAntagonisms(activeCards, [antagonismRule], baseOption);

      expect(result.appliedRules).toContain('ANT_SlowRamp');
      expect(result.modifiedOption.lags.ramp).toBe(4); // floor(3 * 1.5)
    });

    it('should apply multiple antagonisms cumulatively', () => {
      const antagonismRules: AntagonismRule[] = [
        {
          ruleId: 'ANT_A',
          cards: ['CARD_A'],
          multiplier: 0.8,
        },
        {
          ruleId: 'ANT_B',
          cards: ['CARD_B'],
          multiplier: 0.9,
        },
      ];

      const activeCards = ['CARD_A', 'CARD_B'];
      const result = applyAntagonisms(activeCards, antagonismRules, baseOption);

      expect(result.appliedRules).toHaveLength(2);
      expect(result.appliedRules).toContain('ANT_A');
      expect(result.appliedRules).toContain('ANT_B');
      expect(result.modifiedOption.effects[0].delta).toBe(7.2); // 10 * 0.8 * 0.9
    });
  });

  describe('applyCausalityRules', () => {
    it('should apply synergies before antagonisms', () => {
      const synergyRule: SynergyRule = {
        ruleId: 'SYN_Test',
        cards: ['CARD_A'],
        multiplier: 2.0,
      };

      const antagonismRule: AntagonismRule = {
        ruleId: 'ANT_Test',
        cards: ['CARD_B'],
        multiplier: 0.5,
      };

      const activeCards = ['CARD_A', 'CARD_B'];
      const result = applyCausalityRules(
        activeCards,
        [synergyRule],
        [antagonismRule],
        baseOption
      );

      expect(result.synergiesApplied).toContain('SYN_Test');
      expect(result.antagonismsApplied).toContain('ANT_Test');
      // First synergy: 10 * 2.0 = 20
      // Then antagonism: 20 * 0.5 = 10
      expect(result.modifiedOption.effects[0].delta).toBe(10);
    });

    it('should handle no active rules', () => {
      const synergyRule: SynergyRule = {
        ruleId: 'SYN_Test',
        cards: ['CARD_X'],
      };

      const antagonismRule: AntagonismRule = {
        ruleId: 'ANT_Test',
        cards: ['CARD_Y'],
      };

      const activeCards = ['CARD_A', 'CARD_B'];
      const result = applyCausalityRules(
        activeCards,
        [synergyRule],
        [antagonismRule],
        baseOption
      );

      expect(result.synergiesApplied).toHaveLength(0);
      expect(result.antagonismsApplied).toHaveLength(0);
      expect(result.modifiedOption.effects[0].delta).toBe(10); // Unchanged
    });

    it('should handle complex interaction with ramp modifications', () => {
      const synergyRule: SynergyRule = {
        ruleId: 'SYN_Fast',
        cards: ['CARD_A'],
        multiplier: 1.5,
        rampReduction: 0.4, // Reduce ramp by 40%
      };

      const antagonismRule: AntagonismRule = {
        ruleId: 'ANT_Slow',
        cards: ['CARD_B'],
        multiplier: 0.8,
        rampIncrease: 0.5, // Increase ramp by 50%
      };

      const activeCards = ['CARD_A', 'CARD_B'];
      const result = applyCausalityRules(
        activeCards,
        [synergyRule],
        [antagonismRule],
        baseOption
      );

      // Effect delta: 10 * 1.5 * 0.8 = 12
      expect(result.modifiedOption.effects[0].delta).toBe(12);

      // Ramp: floor(3 * 0.6) = 1, then floor(1 * 1.5) = 1
      expect(result.modifiedOption.lags.ramp).toBe(1);
    });

    it('should sort rules by ruleId for determinism', () => {
      const synergyRules: SynergyRule[] = [
        { ruleId: 'SYN_Z', cards: ['CARD_A'], multiplier: 1.1 },
        { ruleId: 'SYN_A', cards: ['CARD_A'], multiplier: 1.2 },
      ];

      const activeCards = ['CARD_A'];
      const result = applySynergies(activeCards, synergyRules, baseOption);

      // Rules should be applied in alphabetical order: SYN_A then SYN_Z
      expect(result.appliedRules[0]).toBe('SYN_A');
      expect(result.appliedRules[1]).toBe('SYN_Z');
      // 10 * 1.2 * 1.1 = 13.2
      expect(result.modifiedOption.effects[0].delta).toBeCloseTo(13.2, 1);
    });
  });
});
