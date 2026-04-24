import { generateVisitorId } from '@cityborn/utils';

export function getOrCreateVisitorId(): string {
  let visitor_id = localStorage.getItem('visitor_id');
  if (!visitor_id) {
    visitor_id = generateVisitorId();
    localStorage.setItem('visitor_id', visitor_id);
  }
  return visitor_id;
}
