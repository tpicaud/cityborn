import {
  type ContractClient,
  createCookieContractClient,
} from '@cityborn/client/api';
import { backOfficeClientConfig } from '@/config/client';

export const contractClient: ContractClient = createCookieContractClient(
  backOfficeClientConfig.restBackendUrl,
  { client: { name: 'back-office' } },
);
