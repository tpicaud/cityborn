import {
  createCookieSocketFactory,
  type SocketFactory,
} from '@cityborn/client/ws';
import { frontendClientConfig } from '@/config/client';
import { getOrCreateVisitorId } from './visitorId';

export const createSocketConnection: SocketFactory = createCookieSocketFactory(
  frontendClientConfig.websocketBackendUrl,
  { getVisitorId: getOrCreateVisitorId },
);
