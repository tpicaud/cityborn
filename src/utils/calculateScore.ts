import { PlayerResults } from "@/types/Results";

// Calculates points based on distance
const calculatePoints = (distance: number) => {
    return Math.max(0, Math.round(1000 * Math.exp(-0.0006 * distance)));
}

const calculateTotalPoints = (results: PlayerResults) => {
    return results.results.reduce((acc, result) => acc + result.points, 0);
}

export { calculatePoints, calculateTotalPoints };