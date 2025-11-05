/**
 * Seeded Random Number Generator
 * Uses a simple linear congruential generator
 */
export class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Returns a random number between 0 and 1
   */
  next(): number {
    // Linear congruential generator
    // Using parameters from Numerical Recipes
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random float between min and max
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Returns true with probability p (0..1)
   */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /**
   * Reset the seed
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }

  /**
   * Get current seed
   */
  getSeed(): number {
    return this.seed;
  }
}
