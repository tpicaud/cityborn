import {
  createCookieSocketFactory,
  type SocketFactory,
} from '@cityborn/client/ws';
import { frontendClientConfig } from '@/config/client';
import { getOrCreateVisitorId } from './visitorId';

export const createSocketConnection: SocketFactory = createCookieSocketFactory({
  websocketUrl: frontendClientConfig.websocketBackendUrl,
  getVisitorId: getOrCreateVisitorId,
});
