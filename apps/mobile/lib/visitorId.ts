import { generateVisitorId } from '@cityborn/utils';
import { asyncStorage } from './asyncStorage';

export async function getOrCreateVisitorId(): Promise<string> {
  let visitor_id = await asyncStorage.get<string>('visitor_id');
  if (!visitor_id) {
    visitor_id = generateVisitorId();
    asyncStorage.set<string>('visitor_id', visitor_id);
  }
  return visitor_id;
}
