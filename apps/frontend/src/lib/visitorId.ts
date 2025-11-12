export function getOrCreateVisitorId(): string {
  let visitor_id = localStorage.getItem('visitor_id');
  if (!visitor_id) {
    visitor_id = crypto.randomUUID();
    localStorage.setItem('visitor_id', visitor_id);
  }
  return visitor_id;
}
