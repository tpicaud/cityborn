import {
  createBearerSocketFactory,
  type SocketFactory,
} from '@cityborn/client/ws';
import { mobileClientConfig } from '@/config/client';
import { tokenStorage } from './tokenStorage';
import { getOrCreateVisitorId } from './visitorId';

export const createSocketConnection: SocketFactory = createBearerSocketFactory(
  mobileClientConfig.websocketBackendUrl,
  tokenStorage,
  { getVisitorId: getOrCreateVisitorId },
);
