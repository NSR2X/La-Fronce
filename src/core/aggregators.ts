import type { KPI, Ministry, DifficultyDataset, MinistryIPM } from '../types';
import { normalizeKPI, getCurrentValue } from './kpi';

/**
 * Calculate Indice de Performance Ministériel (IPM) for a ministry
 * IPM = round(100 * Σ(w_i * norm_i) / Σ(w_i))
 */
export function calculateIPM(ministry: Ministry, kpis: KPI[]): number {
  const ministryKPIs = kpis.filter(k => k.ministry === ministry);

  if (ministryKPIs.length === 0) return 50; // default

  let weightedSum = 0;
  let totalWeight = 0;

  for (const kpi of ministryKPIs) {
    const value = getCurrentValue(kpi);
    const normalized = normalizeKPI(value, kpi);
    weightedSum += kpi.weightInIPM * normalized;
    totalWeight += kpi.weightInIPM;
  }

  if (totalWeight === 0) return 50;

  return Math.round((100 * weightedSum) / totalWeight);
}

/**
 * Calculate all ministry IPMs
 */
export function calculateAllIPMs(kpis: KPI[]): MinistryIPM[] {
  const ministries = [...new Set(kpis.map(k => k.ministry))];

  return ministries.map(ministry => {
    const ministryKPIs = kpis.filter(k => k.ministry === ministry);
    const ipm = calculateIPM(ministry, kpis);

    return {
      ministry,
      ipm,
      kpis: ministryKPIs.map(kpi => ({
        kpiId: kpi.kpiId,
        normalized: normalizeKPI(getCurrentValue(kpi), kpi),
        value: getCurrentValue(kpi),
        label: kpi.label,
      })),
    };
  });
}

/**
 * Calculate Indice Global de Gouvernement (IGG)
 * IGG = round(100 * Σ(W_m * IPM_m) / Σ(W_m))
 */
export function calculateIGG(kpis: KPI[], difficulty: DifficultyDataset): number {
  const ministries = [...new Set(kpis.map(k => k.ministry))];

  // Safety check: use equal weights if difficulty not loaded
  const weights = difficulty?.weights?.ministries || {};

  let weightedSum = 0;
  let totalWeight = 0;

  for (const ministry of ministries) {
    const ipm = calculateIPM(ministry, kpis);
    const weight = weights[ministry] || 1;
    weightedSum += weight * ipm;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 50;

  return Math.round(weightedSum / totalWeight);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate IPM history for the last N months
 */
export function calculateIPMHistory(
  ministry: Ministry,
  kpis: KPI[],
  currentMonth: number,
  historyLength: number = 6
): number[] {
  const ministryKPIs = kpis.filter(k => k.ministry === ministry);

  if (ministryKPIs.length === 0) {
    return Array(historyLength).fill(50);
  }

  const history: number[] = [];
  const startMonth = Math.max(0, currentMonth - historyLength + 1);

  for (let month = startMonth; month <= currentMonth; month++) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const kpi of ministryKPIs) {
      // Find the KPI value at this month
      const historyEntry = kpi.history.find(h => h.month === month);
      const value = historyEntry ? historyEntry.value : getCurrentValue(kpi);
      const normalized = normalizeKPI(value, kpi);
      weightedSum += kpi.weightInIPM * normalized;
      totalWeight += kpi.weightInIPM;
    }

    const ipm = totalWeight === 0 ? 50 : Math.round((100 * weightedSum) / totalWeight);
    history.push(ipm);
  }

  return history;
}

/**
 * Get the 2 most important (vedette) KPIs for a ministry
 */
export function getVedetteKPIs(ministry: Ministry, kpis: KPI[]): KPI[] {
  const ministryKPIs = kpis.filter(k => k.ministry === ministry);

  // Sort by weightInIPM descending and take top 2
  return ministryKPIs
    .sort((a, b) => b.weightInIPM - a.weightInIPM)
    .slice(0, 2);
}

/**
 * Get normalized history for a KPI
 */
export function getKPINormalizedHistory(
  kpi: KPI,
  currentMonth: number,
  historyLength: number = 6
): number[] {
  const history: number[] = [];
  const startMonth = Math.max(0, currentMonth - historyLength + 1);

  for (let month = startMonth; month <= currentMonth; month++) {
    const historyEntry = kpi.history.find(h => h.month === month);
    const value = historyEntry ? historyEntry.value : getCurrentValue(kpi);
    const normalized = normalizeKPI(value, kpi);
    history.push(normalized * 100); // Scale to 0-100
  }

  return history;
}

/**
 * Calculate risk damping factor
 * riskDamp = clamp((TS/100)*α + (RJ/100)*β - (LEG/100)*γ, 0, 0.5)
 * with α=0.4, β=0.3, γ=0.2
 */
export function calculateRiskDamp(ts: number, rj: number, leg: number): number {
  const α = 0.4;
  const β = 0.3;
  const γ = 0.2;

  const riskDamp = (ts / 100) * α + (rj / 100) * β - (leg / 100) * γ;

  return clamp(riskDamp, 0, 0.5);
}
