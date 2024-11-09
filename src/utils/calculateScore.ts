// Calculates points based on distance
const calculatePoints = (distance: number) => {
    return Math.max(0, Math.round(1000 * Math.exp(-0.0006 * distance)));
}

export { calculatePoints };