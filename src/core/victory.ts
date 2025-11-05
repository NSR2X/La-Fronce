import type {
  GameState,
  Objective,
  ObjectiveCheck,
  Comparator,
  EvaluationMethod,
  ObjectiveProgress,
  KPI,
} from '../types';
import { calculateTrend, getLastNValues, getCurrentValue } from './kpi';

/**
 * Evaluate a single check for an objective
 */
export function evaluateCheck(
  check: ObjectiveCheck,
  kpi: KPI,
  evaluationWindow: number,
  method: EvaluationMethod
): boolean {
  const values = getLastNValues(kpi, evaluationWindow);

  if (values.length === 0) return false;

  let evaluatedValue: number;

  switch (method) {
    case 'last':
      evaluatedValue = values[values.length - 1];
      break;

    case 'avg':
      evaluatedValue = values.reduce((sum, v) => sum + v, 0) / values.length;
      break;

    case 'trend': {
      const trend = calculateTrend(values);
      return check.comparator === 'trend_up' ? trend > 0 : trend < 0;
    }
  }

  // For numeric comparators
  if (check.value === undefined) return false;

  switch (check.comparator) {
    case '<=':
      return evaluatedValue <= check.value;
    case '>=':
      return evaluatedValue >= check.value;
    default:
      return false;
  }
}

/**
 * Evaluate an objective and return its progress
 */
export function evaluateObjective(
  objective: Objective,
  kpis: KPI[],
  difficulty: 'easy' | 'normal' | 'hard'
): ObjectiveProgress {
  const target = objective.difficultyTargets[difficulty];
  const { evaluationWindow } = objective;

  const checksStatus = objective.checks.map((check, index) => {
    const kpi = kpis.find(k => k.kpiId === check.kpiId);
    if (!kpi) {
      return {
        checkIndex: index,
        passed: false,
      };
    }

    const passed = evaluateCheck(check, kpi, evaluationWindow.months, evaluationWindow.method);

    return {
      checkIndex: index,
      passed,
      currentValue: getCurrentValue(kpi),
      targetValue: check.value,
    };
  });

  const passedCount = checksStatus.filter(c => c.passed).length;
  const overallPassed = passedCount >= target.requiredCount;
  const progressPct = Math.round((passedCount / objective.checks.length) * 100);

  return {
    objectiveId: objective.objectiveId,
    label: objective.label,
    checksStatus,
    overallPassed,
    progressPct,
  };
}

/**
 * Check if mid-game checkpoint is passed
 */
export function checkMidGameCheckpoint(gameState: GameState): boolean {
  // Safety check: if difficulty not loaded, pass checkpoint
  if (!gameState.difficulty?.objectiveSelection) {
    return true;
  }

  const totalMonths = gameState.difficulty.objectiveSelection.choose * 12; // Assuming 1 year per objective
  const midPoint = Math.floor(totalMonths / 2);

  if (gameState.currentMonth < midPoint) {
    return true; // Not at checkpoint yet
  }

  // Count how many objectives are currently satisfied
  const passedObjectives = gameState.selectedObjectives.map(objId => {
    const objective = gameState.objectives.find(o => o.objectiveId === objId);
    if (!objective) return false;

    const progress = evaluateObjective(objective, gameState.kpis, 'normal');
    return progress.overallPassed;
  }).filter(Boolean).length;

  const required = gameState.difficulty.objectiveSelection.midCheckpointMin;

  return passedObjectives >= required;
}

/**
 * Check Troika defeat conditions
 */
export function checkTroikaDefeat(gameState: GameState): { defeated: boolean; reason?: string } {
  // Safety check: if difficulty not loaded, no defeat
  if (!gameState.difficulty?.troikaThresholds) {
    return { defeated: false };
  }

  const { troikaThresholds } = gameState.difficulty;
  const { budget, counters } = gameState;

  // Check deficit
  const deficitPct = (budget.spending - budget.revenue) / budget.gdp * 100;
  if (deficitPct > Math.abs(troikaThresholds.deficitPct)) {
    // Check if it's been consecutive months
    // For simplicity, we'll trigger immediately
    return {
      defeated: true,
      reason: `Déficit public > ${troikaThresholds.deficitPct}% du PIB`,
    };
  }

  // Check debt + market confidence
  const debtPct = (budget.debt / budget.gdp) * 100;
  if (debtPct > troikaThresholds.debtPct && counters.cm < troikaThresholds.cmMin) {
    return {
      defeated: true,
      reason: `Dette publique > ${troikaThresholds.debtPct}% et confiance des marchés < ${troikaThresholds.cmMin}`,
    };
  }

  // Check interest to revenue ratio
  const interestRate = 0.03; // Simplified: 3% interest rate
  const interestPayments = budget.debt * interestRate;
  const interestToRevenuePct = (interestPayments / budget.revenue) * 100;

  if (interestToRevenuePct > troikaThresholds.interestToRevenuePct) {
    return {
      defeated: true,
      reason: `Intérêts/Recettes > ${troikaThresholds.interestToRevenuePct}%`,
    };
  }

  return { defeated: false };
}

/**
 * Check victory condition at end of game
 */
export function checkVictory(gameState: GameState): boolean {
  const { objectiveSelection } = gameState.difficulty;

  // Count objectives that are satisfied
  const satisfiedCount = gameState.selectedObjectives.map(objId => {
    const objective = gameState.objectives.find(o => o.objectiveId === objId);
    if (!objective) return false;

    const progress = evaluateObjective(objective, gameState.kpis, 'normal');
    return progress.overallPassed;
  }).filter(Boolean).length;

  return satisfiedCount >= objectiveSelection.mustComplete;
}

/**
 * Get Troika warning level (0 = safe, 1 = warning, 2 = danger)
 */
export function getTroikaWarningLevel(gameState: GameState): number {
  const { troikaThresholds } = gameState.difficulty;
  const { budget, counters } = gameState;

  const deficitPct = Math.abs((budget.spending - budget.revenue) / budget.gdp * 100);
  const debtPct = (budget.debt / budget.gdp) * 100;

  const deficitThreshold = Math.abs(troikaThresholds.deficitPct);
  const deficitRatio = deficitPct / deficitThreshold;

  const debtRatio = debtPct / troikaThresholds.debtPct;
  const cmRatio = troikaThresholds.cmMin / counters.cm;

  const maxRatio = Math.max(deficitRatio, debtRatio, cmRatio);

  if (maxRatio >= 1.0) return 2; // Danger
  if (maxRatio >= 0.7) return 1; // Warning
  return 0; // Safe
}
