import type { KPI, Direction, KPIHistoryEntry } from '../types';

/**
 * Normalize a KPI value to 0..1 based on its bounds and direction
 */
export function normalizeKPI(value: number, kpi: KPI): number {
  const { min, max } = kpi.bounds;
  const { direction } = kpi;

  let normalized: number;

  if (direction === 'increase_good') {
    // Higher is better: (value - min) / (max - min)
    normalized = (value - min) / (max - min);
  } else {
    // Lower is better: (max - value) / (max - min)
    normalized = (max - value) / (max - min);
  }

  // Clamp to 0..1
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Get the current value of a KPI (last entry in history)
 */
export function getCurrentValue(kpi: KPI): number {
  if (kpi.history.length === 0) {
    return (kpi.bounds.min + kpi.bounds.max) / 2; // default to middle
  }
  return kpi.history[kpi.history.length - 1].value;
}

/**
 * Get the value of a KPI at a specific date
 */
export function getValueAtDate(kpi: KPI, date: string): number | undefined {
  const entry = kpi.history.find(h => h.date === date);
  return entry?.value;
}

/**
 * Get the value at a specific month index (0-based from start of game)
 */
export function getValueAtMonth(kpi: KPI, startDate: string, monthIndex: number): number {
  const targetDate = addMonths(startDate, monthIndex);
  const entry = kpi.history.find(h => h.date === targetDate);

  if (entry) {
    return entry.value;
  }

  // If not found, interpolate or use last known value
  return getCurrentValue(kpi);
}

/**
 * Add a value to KPI history
 */
export function addHistoryEntry(kpi: KPI, date: string, value: number): KPI {
  // Clamp value to bounds
  const clampedValue = Math.max(kpi.bounds.min, Math.min(kpi.bounds.max, value));

  const newHistory = [...kpi.history, { date, value: clampedValue }];

  // Sort by date
  newHistory.sort((a, b) => a.date.localeCompare(b.date));

  return {
    ...kpi,
    history: newHistory,
  };
}

/**
 * Update the last history entry or add a new one
 */
export function updateCurrentValue(kpi: KPI, date: string, delta: number): KPI {
  const currentValue = getCurrentValue(kpi);
  const newValue = currentValue + delta;

  // Check if last entry is for this date
  const lastEntry = kpi.history[kpi.history.length - 1];
  if (lastEntry && lastEntry.date === date) {
    // Update existing entry
    const newHistory = [...kpi.history];
    newHistory[newHistory.length - 1] = {
      date,
      value: Math.max(kpi.bounds.min, Math.min(kpi.bounds.max, newValue)),
    };
    return { ...kpi, history: newHistory };
  } else {
    // Add new entry
    return addHistoryEntry(kpi, date, newValue);
  }
}

/**
 * Add months to a YYYY-MM date string
 */
export function addMonths(date: string, months: number): string {
  const [year, month] = date.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  d.setMonth(d.getMonth() + months);

  const newYear = d.getFullYear();
  const newMonth = String(d.getMonth() + 1).padStart(2, '0');

  return `${newYear}-${newMonth}`;
}

/**
 * Calculate the trend (slope) of KPI values over a window
 * Returns the slope of linear regression
 */
export function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;

  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, v) => sum + v, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Get the last N values from KPI history
 */
export function getLastNValues(kpi: KPI, n: number): number[] {
  return kpi.history.slice(-n).map(h => h.value);
}
