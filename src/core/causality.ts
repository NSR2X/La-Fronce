import type { SynergyRule, AntagonismRule, CardOption, Lags } from '../types';

/**
 * Apply synergy rules to card options
 */
export function applySynergies(
  activeCardIds: string[],
  synergyRules: SynergyRule[],
  option: CardOption
): { modifiedOption: CardOption; appliedRules: string[] } {
  const appliedRules: string[] = [];
  let modifiedOption = { ...option };

  // Sort rules by ruleId for determinism
  const sortedRules = [...synergyRules].sort((a, b) => a.ruleId.localeCompare(b.ruleId));

  for (const rule of sortedRules) {
    // Check if all cards in the rule are active
    const allActive = rule.cards.every(cardId => activeCardIds.includes(cardId));

    if (allActive) {
      appliedRules.push(rule.ruleId);

      // Apply multiplier to effects
      const multiplier = rule.multiplier || 1.15;
      modifiedOption = {
        ...modifiedOption,
        effects: modifiedOption.effects.map(effect => ({
          ...effect,
          delta: effect.delta * multiplier,
          interval: {
            min: effect.interval.min * multiplier,
            max: effect.interval.max * multiplier,
          },
        })),
      };

      // Apply ramp reduction if specified
      if (rule.rampReduction) {
        const reduction = rule.rampReduction;
        modifiedOption = {
          ...modifiedOption,
          lags: {
            ...modifiedOption.lags,
            ramp: Math.max(0, Math.floor(modifiedOption.lags.ramp * (1 - reduction))),
          },
        };
      }
    }
  }

  return { modifiedOption, appliedRules };
}

/**
 * Apply antagonism rules to card options
 */
export function applyAntagonisms(
  activeCardIds: string[],
  antagonismRules: AntagonismRule[],
  option: CardOption
): { modifiedOption: CardOption; appliedRules: string[] } {
  const appliedRules: string[] = [];
  let modifiedOption = { ...option };

  // Sort rules by ruleId for determinism
  const sortedRules = [...antagonismRules].sort((a, b) => a.ruleId.localeCompare(b.ruleId));

  for (const rule of sortedRules) {
    // Check if all cards in the rule are active
    const allActive = rule.cards.every(cardId => activeCardIds.includes(cardId));

    if (allActive) {
      appliedRules.push(rule.ruleId);

      // Apply multiplier to effects
      const multiplier = rule.multiplier || 0.75;
      modifiedOption = {
        ...modifiedOption,
        effects: modifiedOption.effects.map(effect => ({
          ...effect,
          delta: effect.delta * multiplier,
          interval: {
            min: effect.interval.min * multiplier,
            max: effect.interval.max * multiplier,
          },
        })),
      };

      // Apply ramp increase if specified
      if (rule.rampIncrease) {
        const increase = rule.rampIncrease;
        modifiedOption = {
          ...modifiedOption,
          lags: {
            ...modifiedOption.lags,
            ramp: Math.floor(modifiedOption.lags.ramp * (1 + increase)),
          },
        };
      }
    }
  }

  return { modifiedOption, appliedRules };
}

/**
 * Apply both synergies and antagonisms to a card option
 * Synergies are applied first, then antagonisms (as per spec)
 */
export function applyCausalityRules(
  activeCardIds: string[],
  synergyRules: SynergyRule[],
  antagonismRules: AntagonismRule[],
  option: CardOption
): { modifiedOption: CardOption; synergiesApplied: string[]; antagonismsApplied: string[] } {
  // Apply synergies first
  const { modifiedOption: afterSynergies, appliedRules: synergiesApplied } = applySynergies(
    activeCardIds,
    synergyRules,
    option
  );

  // Then apply antagonisms
  const { modifiedOption: final, appliedRules: antagonismsApplied } = applyAntagonisms(
    activeCardIds,
    antagonismRules,
    afterSynergies
  );

  return {
    modifiedOption: final,
    synergiesApplied,
    antagonismsApplied,
  };
}
