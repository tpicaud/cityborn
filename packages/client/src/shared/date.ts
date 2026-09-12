export const isoToLocalDate = (
  isoString: string,
  withHours: boolean = false,
) => {
  if (!isoString) return null;

  const date = new Date(isoString);

  return withHours
    ? date.toLocaleString()
    : date.toLocaleString().split(',')[0];
};
