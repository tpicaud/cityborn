import type { PlayerResults } from '@cityborn/api';

const calculatePoints = (distance: number) => {
  return Math.max(0, Math.round(1000 * Math.exp(-0.001 * distance)));
};

const calculateTotalPoints = (results: PlayerResults) => {
  return results.results.reduce((acc, result) => acc + result.points, 0);
};

export { calculatePoints, calculateTotalPoints };
