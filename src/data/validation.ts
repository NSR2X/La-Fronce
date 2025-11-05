import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { KPIDataset, CardsDataset, ObjectivesDataset, DifficultyDataset } from '../types';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Import schemas
import kpiSchema from '../../schemas/kpi-dataset.schema.json';
import cardsSchema from '../../schemas/cards-dataset.schema.json';
import objectivesSchema from '../../schemas/objectives-dataset.schema.json';
import difficultySchema from '../../schemas/difficulty-dataset.schema.json';

const validateKPI = ajv.compile(kpiSchema);
const validateCards = ajv.compile(cardsSchema);
const validateObjectives = ajv.compile(objectivesSchema);
const validateDifficulty = ajv.compile(difficultySchema);

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export function validateKPIDataset(data: unknown): ValidationResult {
  const valid = validateKPI(data);
  if (!valid) {
    return {
      valid: false,
      errors: validateKPI.errors?.map(err =>
        `${err.instancePath} ${err.message}`
      ) || ['Unknown validation error']
    };
  }
  return { valid: true };
}

export function validateCardsDataset(data: unknown): ValidationResult {
  const valid = validateCards(data);
  if (!valid) {
    return {
      valid: false,
      errors: validateCards.errors?.map(err =>
        `${err.instancePath} ${err.message}`
      ) || ['Unknown validation error']
    };
  }
  return { valid: true };
}

export function validateObjectivesDataset(data: unknown): ValidationResult {
  const valid = validateObjectives(data);
  if (!valid) {
    return {
      valid: false,
      errors: validateObjectives.errors?.map(err =>
        `${err.instancePath} ${err.message}`
      ) || ['Unknown validation error']
    };
  }
  return { valid: true };
}

export function validateDifficultyDataset(data: unknown): ValidationResult {
  const valid = validateDifficulty(data);
  if (!valid) {
    return {
      valid: false,
      errors: validateDifficulty.errors?.map(err =>
        `${err.instancePath} ${err.message}`
      ) || ['Unknown validation error']
    };
  }
  return { valid: true };
}

export function parseJSON(text: string): { success: boolean; data?: unknown; error?: string } {
  try {
    const data = JSON.parse(text);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}
