const calendarDatePattern: RegExp = /^(\d{4})-(\d{2})-(\d{2})$/;

const dateFormatOptions: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

function toDate(isoDate: string): Date {
  const calendarDateMatch: RegExpExecArray | null =
    calendarDatePattern.exec(isoDate);
  if (!calendarDateMatch) return new Date(isoDate);
  const [, year, month, day]: string[] = calendarDateMatch;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function formatDate(isoDate: string): string {
  const dateFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(
    'fr-FR',
    dateFormatOptions,
  );
  return dateFormat.format(toDate(isoDate));
}
