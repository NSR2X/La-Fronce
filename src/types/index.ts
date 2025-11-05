// ====================================
// ENUMS & CONSTANTS
// ====================================

export const MINISTRIES = [
  'EconomyFinance',
  'LaborEmployment',
  'Health',
  'EducationResearch',
  'InteriorJustice',
  'HousingPlanning',
  'EnergyClimateIndustry',
  'Transport',
  'SocialAffairs',
  'ForeignEU',
  'Defense',
  'CultureYouthSport',
  'DigitalSovereignty',
] as const;

export type Ministry = typeof MINISTRIES[number];

export type Direction = 'increase_good' | 'decrease_good';

export type CardType = 'budget' | 'law' | 'decree' | 'diplomacy' | 'communication' | 'event';

export type Confidence = 'low' | 'med' | 'high';

export type Profile = 'step' | 'linear' | 'sigmoid' | 'exp';

export type Comparator = '<=' | '>=' | 'trend_up' | 'trend_down';

export type EvaluationMethod = 'last' | 'avg' | 'trend';

export type DifficultyMode = 'moderate' | 'severe' | 'extreme';

// ====================================
// KPI TYPES
// ====================================

export interface KPIHistoryEntry {
  date: string; // YYYY-MM
  value: number;
}

export interface KPIBounds {
  min: number;
  max: number;
}

export interface KPISource {
  name: string;
  url?: string;
}

export interface KPI {
  kpiId: string;
  ministry: Ministry;
  label: string;
  unit: string;
  direction: Direction;
  bounds: KPIBounds;
  history: KPIHistoryEntry[];
  weightInIPM: number; // 0..1
  source: KPISource;
  lastUpdated: string; // YYYY-MM
}

export interface KPIDataset {
  version?: string;
  kpis: KPI[];
}

// ====================================
// CARDS TYPES
// ====================================

export interface Lags {
  start: number; // months
  ramp: number;
  duration: number;
}

export interface Effect {
  kpiId: string;
  delta: number; // in KPI units
  interval: {
    min: number;
    max: number;
  };
  confidence: Confidence;
  profile: Profile;
}

export interface Costs {
  eur: number; // can be negative (revenue)
  cp: number; // political capital
  leg: number; // legitimacy
  rj: number; // legal risks
  cm: number; // market confidence
}

export interface Risks {
  probRJ?: number; // 0..1
  probStrike?: number; // 0..1
}

export interface CardOption {
  label: string;
  costs: Costs;
  lags: Lags;
  effects: Effect[];
  risks?: Risks;
  synergies?: string[]; // rule ids
  antagonisms?: string[]; // rule ids
}

export interface Card {
  cardId: string;
  type: CardType;
  title?: string;
  description?: string;
  ministries: Ministry[];
  options: CardOption[]; // 2..4
}

export interface CardsDataset {
  version?: string;
  cards: Card[];
  synergyRules?: SynergyRule[];
  antagonismRules?: AntagonismRule[];
}

export interface SynergyRule {
  ruleId: string;
  cards: string[]; // card ids
  multiplier?: number; // default 1.15
  rampReduction?: number; // default 0.25 (25%)
}

export interface AntagonismRule {
  ruleId: string;
  cards: string[]; // card ids
  multiplier?: number; // default 0.75
  rampIncrease?: number; // default 0.25 (25%)
}

// ====================================
// OBJECTIVES TYPES
// ====================================

export interface ObjectiveCheck {
  kpiId: string;
  comparator: Comparator;
  value?: number; // required except for trend comparators
}

export interface EvaluationWindow {
  months: number;
  method: EvaluationMethod;
}

export interface TargetSet {
  requiredCount: number; // how many checks must pass
  tolerance?: number; // optional tolerance for numeric checks
}

export interface Objective {
  objectiveId: string;
  label: string;
  description: string;
  checks: ObjectiveCheck[]; // 1..3
  evaluationWindow: EvaluationWindow;
  difficultyTargets: {
    easy: TargetSet;
    normal: TargetSet;
    hard: TargetSet;
  };
}

export interface ObjectivesDataset {
  version?: string;
  objectives: Objective[];
}

// ====================================
// DIFFICULTY TYPES
// ====================================

export interface ObjectiveSelection {
  choose: number; // how many objectives to choose at start
  mustComplete: number; // how many must be completed at end
  midCheckpointMin: number; // minimum at mid-game
}

export interface TroikaThresholds {
  deficitPct: number; // deficit as % of GDP
  months: number; // consecutive months
  debtPct: number; // debt as % of GDP
  cmMin: number; // min market confidence
  interestToRevenuePct: number; // interest/revenue ratio
}

export interface DifficultyDataset {
  mode: DifficultyMode;
  objectiveSelection: ObjectiveSelection;
  troikaThresholds: TroikaThresholds;
  weights: {
    ministries: Record<Ministry, number>; // weights for IGG calculation
  };
}

// ====================================
// GAME STATE TYPES
// ====================================

export interface GlobalCounters {
  ts: number; // Tension Sociale (0..100)
  cm: number; // Confiance Marchés (0..100)
  leg: number; // Légitimité (0..100)
  rj: number; // Risques Juridiques (0..100)
  cp: number; // Capital Politique (0..100)
}

export interface ScheduledEffect {
  effectId: string;
  cardId: string;
  optionIndex: number;
  effect: Effect;
  lags: Lags;
  appliedAt: number; // month number
  profile: Profile;
  synergiesApplied?: string[];
  antagonismsApplied?: string[];
}

export interface PlayedCard {
  cardId: string;
  optionIndex: number;
  playedAt: number; // month number
}

export interface GameState {
  saveId: string;
  seed: number;
  currentMonth: number; // 0-based
  startDate: string; // YYYY-MM

  // Data
  kpis: KPI[];
  cards: Card[];
  objectives: Objective[];
  difficulty: DifficultyDataset;

  // Selected objectives
  selectedObjectives: string[]; // objective ids

  // Counters
  counters: GlobalCounters;

  // Budget
  budget: {
    revenue: number;
    spending: number;
    debt: number;
    gdp: number;
  };

  // History
  playedCards: PlayedCard[];
  scheduledEffects: ScheduledEffect[];

  // Victory/Defeat
  status: 'playing' | 'victory' | 'defeat';
  defeatReason?: string;
}

// ====================================
// UI TYPES
// ====================================

export interface MinistryIPM {
  ministry: Ministry;
  ipm: number; // 0..100
  kpis: {
    kpiId: string;
    normalized: number; // 0..1
    value: number;
    label: string;
  }[];
}

export interface ObjectiveProgress {
  objectiveId: string;
  label: string;
  checksStatus: {
    checkIndex: number;
    passed: boolean;
    currentValue?: number;
    targetValue?: number;
  }[];
  overallPassed: boolean;
  progressPct: number; // 0..100
}

export interface MonthlyReport {
  month: number;
  igg: number;
  troikaWarnings: string[];
  objectivesProgress: ObjectiveProgress[];
  ministries: MinistryIPM[];
  cardsPlayed: PlayedCard[];
  events: string[];
  budgetSummary: {
    revenue: number;
    spending: number;
    balance: number;
    debt: number;
  };
}

// ====================================
// IMPORT/EXPORT TYPES
// ====================================

export interface ImportResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface SaveGame {
  version: string;
  gameState: GameState;
  exportedAt: string; // ISO 8601
}
