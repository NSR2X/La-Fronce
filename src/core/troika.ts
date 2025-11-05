import type { GameState } from '../types';

/**
 * Calculate Troika danger level (0-100)
 * Based on proximity to defeat triggers (§7.3)
 */
export function calculateTroikaDangerLevel(gameState: GameState): number {
  const { budget, counters, difficulty } = gameState;
  const thresholds = difficulty.troikaThresholds;

  let dangerScore = 0;

  // 1. Deficit check
  const deficitPct = ((budget.spending - budget.revenue) / budget.gdp) * 100;
  const deficitDanger = Math.max(0, Math.min(100, (deficitPct / thresholds.deficitPct) * 100));
  dangerScore += deficitDanger * 0.35; // 35% weight

  // 2. Debt check
  const debtPct = (budget.debt / budget.gdp) * 100;
  const debtDanger = Math.max(0, Math.min(100, (debtPct / thresholds.debtPct) * 100));
  dangerScore += debtDanger * 0.30; // 30% weight

  // 3. Market confidence check (inverse: low CM = high danger)
  const cmDanger = Math.max(0, Math.min(100, (100 - counters.cm)));
  dangerScore += cmDanger * 0.20; // 20% weight

  // 4. Interest to revenue ratio check
  // Simplified: estimate interest as debt * 3% annual rate / 12 months
  const monthlyInterest = (budget.debt * 0.03) / 12;
  const interestToRevenue = (monthlyInterest / budget.revenue) * 100;
  const interestDanger = Math.max(0, Math.min(100, (interestToRevenue / thresholds.interestToRevenuePct) * 100));
  dangerScore += interestDanger * 0.15; // 15% weight

  return Math.round(Math.min(100, dangerScore));
}

/**
 * Get Troika level description
 */
export function getTroikaLevelDescription(level: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (level < 25) {
    return {
      label: 'Stable',
      color: '#16A34A', // success
      bgColor: '#DCFCE7',
    };
  } else if (level < 50) {
    return {
      label: 'Surveillance',
      color: '#F59E0B', // warning
      bgColor: '#FEF3C7',
    };
  } else if (level < 75) {
    return {
      label: 'Alerte',
      color: '#EA580C', // orange
      bgColor: '#FFEDD5',
    };
  } else {
    return {
      label: 'Danger Imminent',
      color: '#DC2626', // alert
      bgColor: '#FEE2E2',
    };
  }
}
