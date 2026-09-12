import { createVisitorIdResolver } from '@cityborn/client/infrastructure';
import { asyncStorage } from './asyncStorage';

export const getOrCreateVisitorId = createVisitorIdResolver(asyncStorage);
