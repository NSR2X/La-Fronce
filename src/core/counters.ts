import type { KPI, GlobalCounters } from '../types';
import { getCurrentValue } from './kpi';
import { clamp } from './aggregators';

/**
 * Update global counters (TS, CM, LEG, RJ, CP) based on KPI changes
 * Spec §10.3: Counters MUST be derived from emblematic KPIs
 */
export function updateCountersFromKPIs(
  counters: GlobalCounters,
  kpis: KPI[],
  previousKPIs: KPI[]
): GlobalCounters {
  let newCounters = { ...counters };

  // Helper to get KPI current value
  const getKPI = (kpiId: string, kpiList: KPI[]) => {
    const kpi = kpiList.find(k => k.kpiId === kpiId);
    return kpi ? getCurrentValue(kpi) : 0;
  };

  const current = (id: string) => getKPI(id, kpis);
  const previous = (id: string) => getKPI(id, previousKPIs);
  const delta = (id: string) => current(id) - previous(id);

  // ===== TENSION SOCIALE (TS) =====
  // Inflation: high inflation increases social tension
  if (current('inflation_rate') > 4) {
    newCounters.ts += 2;
  } else if (current('inflation_rate') > 3) {
    newCounters.ts += 1;
  }

  // Unemployment: high unemployment increases tension
  const unemploymentRate = 100 - current('employment_rate');
  if (unemploymentRate > 10) {
    newCounters.ts += 3;
  } else if (unemploymentRate > 8) {
    newCounters.ts += 1;
  }

  // Poverty: increasing poverty raises tension
  if (delta('poverty_rate') > 0.5) {
    newCounters.ts += 2;
  }

  // Health: deteriorating health system increases tension
  if (delta('hospital_capacity') < -5) {
    newCounters.ts += 2;
  }

  // ===== CONFIANCE MARCHÉS (CM) =====
  // Deficit: high deficit reduces market confidence
  const deficitPct = Math.abs(current('deficit_pct_gdp'));
  if (deficitPct > 5) {
    newCounters.cm -= 3;
  } else if (deficitPct > 3) {
    newCounters.cm -= 1;
  } else if (deficitPct < 2) {
    newCounters.cm += 1; // Good fiscal management
  }

  // Debt: high debt reduces confidence
  if (current('debt_pct_gdp') > 120) {
    newCounters.cm -= 2;
  } else if (current('debt_pct_gdp') > 100) {
    newCounters.cm -= 1;
  }

  // GDP growth: positive growth increases confidence
  if (current('gdp_growth') > 2) {
    newCounters.cm += 2;
  } else if (current('gdp_growth') > 1) {
    newCounters.cm += 1;
  } else if (current('gdp_growth') < -1) {
    newCounters.cm -= 2;
  }

  // Investment: increasing investment boosts confidence
  if (delta('investment_rate') > 0.5) {
    newCounters.cm += 1;
  }

  // ===== LÉGITIMITÉ (LEG) =====
  // Public trust: directly affects legitimacy
  if (delta('public_trust') < -5) {
    newCounters.leg -= 3;
  } else if (delta('public_trust') > 5) {
    newCounters.leg += 2;
  }

  // Education: improving education increases legitimacy
  if (delta('education_success_rate') > 2) {
    newCounters.leg += 1;
  }

  // Security: crime affects legitimacy
  if (current('crime_rate') > 50) {
    newCounters.leg -= 1;
  } else if (delta('crime_rate') < -5) {
    newCounters.leg += 1;
  }

  // ===== RISQUES JURIDIQUES (RJ) =====
  // High RJ naturally decays slowly over time if no new issues
  newCounters.rj = Math.max(0, newCounters.rj - 0.5);

  // Environmental issues can trigger legal risks
  if (delta('carbon_emissions') > 5) {
    newCounters.rj += 1;
  }

  // Labor issues can trigger legal challenges
  if (delta('employment_rate') < -1) {
    newCounters.rj += 1;
  }

  // ===== CAPITAL POLITIQUE (CP) =====
  // CP recovers slowly each month (already done in advanceMonth)
  // But loses when TS is very high
  if (newCounters.ts > 80) {
    newCounters.cp -= 2;
  }

  // Loses when legitimacy is very low
  if (newCounters.leg < 20) {
    newCounters.cp -= 1;
  }

  // Clamp all counters to [0, 100]
  newCounters.ts = clamp(newCounters.ts, 0, 100);
  newCounters.cm = clamp(newCounters.cm, 0, 100);
  newCounters.leg = clamp(newCounters.leg, 0, 100);
  newCounters.rj = clamp(newCounters.rj, 0, 100);
  newCounters.cp = clamp(newCounters.cp, 0, 100);

  return newCounters;
}
