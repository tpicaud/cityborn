import {
  createVisitorIdProvider,
  type VisitorIdProvider,
} from '@cityborn/client/api';
import { keyValueStorage } from './keyValueStorage';

export const getOrCreateVisitorId: VisitorIdProvider =
  createVisitorIdProvider(keyValueStorage);
