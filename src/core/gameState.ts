import type {
  GameState,
  KPIDataset,
  CardsDataset,
  ObjectivesDataset,
  DifficultyDataset,
  Card,
  CardOption,
  ScheduledEffect,
  PlayedCard,
  GlobalCounters,
  MonthlyReport,
} from '../types';
import { hashString } from '../data/db';
import { SeededRNG } from './rng';
import { addMonths, updateCurrentValue } from './kpi';
import { calculateEffectDelta, getActiveEffects } from './effects';
import { calculateRiskDamp, calculateAllIPMs, calculateIGG, clamp } from './aggregators';
import { applyCausalityRules } from './causality';
import { checkMidGameCheckpoint, checkTroikaDefeat, checkVictory, evaluateObjective } from './victory';

/**
 * Create a new game state
 */
export function createNewGame(
  kpiDataset: KPIDataset,
  cardsDataset: CardsDataset,
  objectivesDataset: ObjectivesDataset,
  difficultyDataset: DifficultyDataset,
  selectedObjectiveIds: string[]
): GameState {
  const saveId = `game-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const seed = hashString(saveId);

  // Get start date from KPI dataset (last date in first KPI)
  const startDate = kpiDataset.kpis[0]?.history[kpiDataset.kpis[0].history.length - 1]?.date || '2025-01';

  return {
    saveId,
    seed,
    currentMonth: 0,
    startDate,
    kpis: kpiDataset.kpis,
    cards: cardsDataset.cards,
    objectives: objectivesDataset.objectives,
    difficulty: difficultyDataset,
    selectedObjectives: selectedObjectiveIds,
    counters: {
      ts: 50, // Tension Sociale
      cm: 50, // Confiance Marchés
      leg: 50, // Légitimité
      rj: 50, // Risques Juridiques
      cp: 100, // Capital Politique (starts at max)
    },
    budget: {
      revenue: 1000, // Simplified values in billions
      spending: 1100,
      debt: 2800,
      gdp: 2500,
    },
    playedCards: [],
    scheduledEffects: [],
    status: 'playing',
  };
}

/**
 * Play a card option
 */
export function playCard(
  gameState: GameState,
  cardId: string,
  optionIndex: number,
  synergyRules: any[] = [],
  antagonismRules: any[] = []
): GameState {
  const card = gameState.cards.find(c => c.cardId === cardId);
  if (!card || optionIndex >= card.options.length) {
    throw new Error('Invalid card or option');
  }

  const option = card.options[optionIndex];

  // Get active card IDs for causality
  const activeCardIds = gameState.playedCards.map(pc => pc.cardId);

  // Apply causality rules
  const { modifiedOption, synergiesApplied, antagonismsApplied } = applyCausalityRules(
    activeCardIds,
    synergyRules,
    antagonismRules,
    option
  );

  // Apply costs immediately
  let newCounters = { ...gameState.counters };
  newCounters.cp = clamp(newCounters.cp - modifiedOption.costs.cp, 0, 100);
  newCounters.leg = clamp(newCounters.leg - modifiedOption.costs.leg, 0, 100);
  newCounters.rj = clamp(newCounters.rj + modifiedOption.costs.rj, 0, 100);
  newCounters.cm = clamp(newCounters.cm - modifiedOption.costs.cm, 0, 100);

  let newBudget = { ...gameState.budget };
  newBudget.spending += modifiedOption.costs.eur;

  // Schedule effects
  const newScheduledEffects: ScheduledEffect[] = modifiedOption.effects.map((effect, idx) => ({
    effectId: `${cardId}-${optionIndex}-${idx}-${gameState.currentMonth}`,
    cardId,
    optionIndex,
    effect,
    lags: modifiedOption.lags,
    appliedAt: gameState.currentMonth,
    profile: effect.profile,
    synergiesApplied,
    antagonismsApplied,
  }));

  // Add played card to history
  const newPlayedCard: PlayedCard = {
    cardId,
    optionIndex,
    playedAt: gameState.currentMonth,
  };

  return {
    ...gameState,
    counters: newCounters,
    budget: newBudget,
    playedCards: [...gameState.playedCards, newPlayedCard],
    scheduledEffects: [...gameState.scheduledEffects, ...newScheduledEffects],
  };
}

/**
 * Advance game by one month
 */
export function advanceMonth(gameState: GameState): GameState {
  const newMonth = gameState.currentMonth + 1;
  const currentDate = addMonths(gameState.startDate, newMonth);

  // Get active effects for this month
  const activeEffects = getActiveEffects(gameState.scheduledEffects, newMonth);

  // Calculate risk damp
  const riskDamp = calculateRiskDamp(
    gameState.counters.ts,
    gameState.counters.rj,
    gameState.counters.leg
  );

  // Apply effects to KPIs
  let newKPIs = [...gameState.kpis];

  for (const scheduledEffect of activeEffects) {
    const monthsSinceApplied = newMonth - scheduledEffect.appliedAt;
    const delta = calculateEffectDelta(
      scheduledEffect.effect,
      scheduledEffect.lags,
      scheduledEffect.profile,
      monthsSinceApplied,
      riskDamp
    );

    // Find and update the KPI
    const kpiIndex = newKPIs.findIndex(k => k.kpiId === scheduledEffect.effect.kpiId);
    if (kpiIndex !== -1) {
      newKPIs[kpiIndex] = updateCurrentValue(newKPIs[kpiIndex], currentDate, delta);
    }
  }

  // Update budget
  let newBudget = { ...gameState.budget };
  const balance = newBudget.revenue - newBudget.spending;
  newBudget.debt += Math.abs(balance); // Simplified: deficit adds to debt

  // Natural decay/changes to counters (simplified)
  let newCounters = { ...gameState.counters };
  newCounters.ts = clamp(newCounters.ts - 1, 0, 100); // Slowly decrease tension
  newCounters.cp = clamp(newCounters.cp + 2, 0, 100); // Recover political capital

  // Check defeat conditions
  const troikaCheck = checkTroikaDefeat({ ...gameState, currentMonth: newMonth, kpis: newKPIs, budget: newBudget, counters: newCounters });
  if (troikaCheck.defeated) {
    return {
      ...gameState,
      currentMonth: newMonth,
      kpis: newKPIs,
      budget: newBudget,
      counters: newCounters,
      status: 'defeat',
      defeatReason: troikaCheck.reason,
    };
  }

  const midGamePassed = checkMidGameCheckpoint({ ...gameState, currentMonth: newMonth, kpis: newKPIs });
  if (!midGamePassed) {
    return {
      ...gameState,
      currentMonth: newMonth,
      kpis: newKPIs,
      budget: newBudget,
      counters: newCounters,
      status: 'defeat',
      defeatReason: 'Objectifs insuffisants au checkpoint mi-parcours',
    };
  }

  return {
    ...gameState,
    currentMonth: newMonth,
    kpis: newKPIs,
    budget: newBudget,
    counters: newCounters,
  };
}

/**
 * Generate a monthly report
 */
export function generateMonthlyReport(gameState: GameState): MonthlyReport {
  const ministryIPMs = calculateAllIPMs(gameState.kpis);
  const igg = calculateIGG(gameState.kpis, gameState.difficulty);

  const objectivesProgress = gameState.selectedObjectives.map(objId => {
    const objective = gameState.objectives.find(o => o.objectiveId === objId);
    if (!objective) {
      return {
        objectiveId: objId,
        label: 'Unknown',
        checksStatus: [],
        overallPassed: false,
        progressPct: 0,
      };
    }
    return evaluateObjective(objective, gameState.kpis, 'normal');
  });

  const cardsPlayedThisMonth = gameState.playedCards.filter(
    pc => pc.playedAt === gameState.currentMonth
  );

  return {
    month: gameState.currentMonth,
    igg,
    troikaWarnings: [], // TODO: implement warnings
    objectivesProgress,
    ministries: ministryIPMs,
    cardsPlayed: cardsPlayedThisMonth,
    events: [],
    budgetSummary: {
      revenue: gameState.budget.revenue,
      spending: gameState.budget.spending,
      balance: gameState.budget.revenue - gameState.budget.spending,
      debt: gameState.budget.debt,
    },
  };
}
