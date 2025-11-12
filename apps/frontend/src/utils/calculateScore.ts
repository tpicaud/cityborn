import { PlayerResults } from '@cityborn/types';

// Calculates points based on distance
const calculatePoints = (distance: number) => {
  return Math.max(0, Math.round(1000 * Math.exp(-0.001 * distance))); // Augmentation du facteur 0.0006 -> 0.001
};

const calculateTotalPoints = (results: PlayerResults) => {
  return results.results.reduce((acc, result) => acc + result.points, 0);
};

export { calculatePoints, calculateTotalPoints };
