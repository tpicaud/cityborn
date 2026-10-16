import { format, parseISO } from 'date-fns';

export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'dd/MM/yyyy');
}
