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
import { drawEventCard, applyEventCard } from './events';

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

  // Step 1: Draw and apply event card (§6.1)
  let currentState = { ...gameState, currentMonth: newMonth };
  const eventCard = drawEventCard(currentState);
  if (eventCard) {
    const { cardId, optionIndex } = applyEventCard(eventCard);
    // Apply the event as a regular card
    currentState = playCard(currentState, cardId, optionIndex);
  }

  // Get active effects for this month
  const activeEffects = getActiveEffects(currentState.scheduledEffects, newMonth);

  // Calculate risk damp
  const riskDamp = calculateRiskDamp(
    currentState.counters.ts,
    currentState.counters.rj,
    currentState.counters.leg
  );

  // Apply effects to KPIs
  let newKPIs = [...currentState.kpis];

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
  let newBudget = { ...currentState.budget };
  const balance = newBudget.revenue - newBudget.spending;
  newBudget.debt += Math.abs(balance); // Simplified: deficit adds to debt

  // Natural decay/changes to counters (simplified)
  let newCounters = { ...currentState.counters };
  newCounters.ts = clamp(newCounters.ts - 1, 0, 100); // Slowly decrease tension
  newCounters.cp = clamp(newCounters.cp + 2, 0, 100); // Recover political capital

  // Check defeat conditions
  const troikaCheck = checkTroikaDefeat({ ...currentState, currentMonth: newMonth, kpis: newKPIs, budget: newBudget, counters: newCounters });
  if (troikaCheck.defeated) {
    return {
      ...currentState,
      currentMonth: newMonth,
      kpis: newKPIs,
      budget: newBudget,
      counters: newCounters,
      status: 'defeat',
      defeatReason: troikaCheck.reason,
    };
  }

  const midGamePassed = checkMidGameCheckpoint({ ...currentState, currentMonth: newMonth, kpis: newKPIs });
  if (!midGamePassed) {
    return {
      ...currentState,
      currentMonth: newMonth,
      kpis: newKPIs,
      budget: newBudget,
      counters: newCounters,
      status: 'defeat',
      defeatReason: 'Objectifs insuffisants au checkpoint mi-parcours',
    };
  }

  return {
    ...currentState,
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

  // Generate Troika warnings based on thresholds
  const troikaWarnings = generateTroikaWarnings(gameState);

  // Get events from this month (events are cards of type 'event')
  const eventsThisMonth = cardsPlayedThisMonth
    .map(pc => {
      const card = gameState.cards.find(c => c.cardId === pc.cardId);
      if (card && card.type === 'event') {
        return card.title || card.cardId;
      }
      return null;
    })
    .filter(Boolean) as string[];

  return {
    month: gameState.currentMonth,
    igg,
    troikaWarnings,
    objectivesProgress,
    ministries: ministryIPMs,
    cardsPlayed: cardsPlayedThisMonth,
    events: eventsThisMonth,
    budgetSummary: {
      revenue: gameState.budget.revenue,
      spending: gameState.budget.spending,
      balance: gameState.budget.revenue - gameState.budget.spending,
      debt: gameState.budget.debt,
    },
  };
}

/**
 * Generate Troika warning messages based on proximity to triggers
 */
function generateTroikaWarnings(gameState: GameState): string[] {
  const warnings: string[] = [];
  const { budget, counters, difficulty } = gameState;
  const thresholds = difficulty.troikaThresholds;

  // Deficit warning
  const deficitPct = ((budget.spending - budget.revenue) / budget.gdp) * 100;
  if (deficitPct > thresholds.deficitPct * 0.8) {
    warnings.push(`⚠️ Déficit élevé (${deficitPct.toFixed(1)}% du PIB). Seuil Troïka: ${thresholds.deficitPct}%`);
  }

  // Debt warning
  const debtPct = (budget.debt / budget.gdp) * 100;
  if (debtPct > thresholds.debtPct * 0.9) {
    warnings.push(`⚠️ Dette publique critique (${debtPct.toFixed(1)}% du PIB). Seuil Troïka: ${thresholds.debtPct}%`);
  }

  // Market confidence warning
  if (counters.cm < thresholds.cmMin + 10) {
    warnings.push(`⚠️ Confiance des marchés faible (${counters.cm}/100). Seuil Troïka: ${thresholds.cmMin}`);
  }

  // Interest burden warning
  const monthlyInterest = (budget.debt * 0.03) / 12;
  const interestToRevenue = (monthlyInterest / budget.revenue) * 100;
  if (interestToRevenue > thresholds.interestToRevenuePct * 0.85) {
    warnings.push(`⚠️ Charge d'intérêts élevée (${interestToRevenue.toFixed(1)}% des recettes). Seuil Troïka: ${thresholds.interestToRevenuePct}%`);
  }

  // Social tension warning
  if (counters.ts > 70) {
    warnings.push(`⚠️ Tension sociale élevée (${counters.ts}/100). Risque de manifestations massives`);
  }

  // Low legitimacy warning
  if (counters.leg < 30) {
    warnings.push(`⚠️ Légitimité faible (${counters.leg}/100). Risque de motion de censure`);
  }

  return warnings;
}
