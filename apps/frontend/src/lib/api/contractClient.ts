import {
  type ContractClient,
  createCookieContractClient,
} from '@cityborn/client/api';
import { frontendClientConfig } from '@/config/client';
import { getOrCreateVisitorId } from '@/lib/visitorId';

export const contractClient: ContractClient = createCookieContractClient(
  frontendClientConfig.restBackendUrl,
  {
    client: { name: 'web' },
    getVisitorId: getOrCreateVisitorId,
  },
);
