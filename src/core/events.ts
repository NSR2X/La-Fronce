import type { Card, GameState } from '../types';
import { SeededRNG } from './rng';

/**
 * Draw a random event card if conditions are met
 * According to spec §5.5:
 * - 1 Event/month if TS>60 OR CM<40
 * - Otherwise 1/3 chance
 */
export function drawEventCard(gameState: GameState): Card | null {
  const { counters, cards, seed, currentMonth } = gameState;

  // Create RNG seeded with game seed + current month for determinism
  const rng = new SeededRNG(seed + currentMonth);

  // Get all event cards
  const eventCards = cards.filter(c => c.type === 'event');
  if (eventCards.length === 0) {
    return null;
  }

  // Determine if we should draw an event
  let shouldDrawEvent = false;

  if (counters.ts > 60 || counters.cm < 40) {
    // High tension or low market confidence: always draw event
    shouldDrawEvent = true;
  } else {
    // Otherwise 1/3 chance
    shouldDrawEvent = rng.next() < (1/3);
  }

  if (!shouldDrawEvent) {
    return null;
  }

  // Draw random event from available events
  const randomIndex = Math.floor(rng.next() * eventCards.length);
  return eventCards[randomIndex];
}

/**
 * Apply an event card automatically (events have only one option)
 */
export function applyEventCard(card: Card): {
  cardId: string;
  optionIndex: number;
} {
  // Events always have a single "Subir" option at index 0
  return {
    cardId: card.cardId,
    optionIndex: 0,
  };
}
