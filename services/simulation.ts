import { SimulationResult } from '../types';

interface SimulationParams {
  annualizedFrequency: number;
  minLoss: number;
  maxLoss: number;
  mostLikelyLoss: number;
  iterations: number;
}

/**
 * Generates a random number from a Poisson distribution.
 * Uses Knuth's algorithm.
 * @param lambda - The average rate (μ) of events.
 * @returns A random integer representing the number of events.
 */
function poissonRandom(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

/**
 * Generates a random number from a Triangular distribution.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @param mode - The most likely value (peak).
 * @returns A random number within the [min, max] range.
 */
function triangularRandom(min: number, max: number, mode: number): number {
  const U = Math.random();
  const F = (mode - min) / (max - min);
  if (U <= F) {
    return min + Math.sqrt(U * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - U) * (max - min) * (max - mode));
  }
}

export function runSimulation({
  annualizedFrequency,
  minLoss,
  maxLoss,
  mostLikelyLoss,
  iterations,
}: SimulationParams): SimulationResult {
  const annualLosses: number[] = [];

  // Use new default if most likely is not provided or invalid
  const isValidMostLikely = mostLikelyLoss > 0 && mostLikelyLoss >= minLoss && mostLikelyLoss <= maxLoss;
  const mode = isValidMostLikely ? mostLikelyLoss : (minLoss + (maxLoss - minLoss) / 3);

  if (minLoss <= 0 || maxLoss <= 0 || maxLoss < minLoss || isNaN(mode)) {
      return [];
  }

  for (let i = 0; i < iterations; i++) {
    const numEvents = poissonRandom(annualizedFrequency);
    let totalLossThisYear = 0;

    for (let j = 0; j < numEvents; j++) {
      totalLossThisYear += triangularRandom(minLoss, maxLoss, mode);
    }
    annualLosses.push(totalLossThisYear);
  }

  // Sort in descending order for the Loss Exceedance Curve
  return annualLosses.sort((a, b) => b - a);
}