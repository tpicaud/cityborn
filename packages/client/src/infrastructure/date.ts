export function isoToLocalDate(
  isoString: string,
  withHours: boolean = false,
): string | null {
  if (!isoString) return null;

  const date = new Date(isoString);

  return withHours
    ? date.toLocaleString()
    : date.toLocaleString().split(',')[0];
}
