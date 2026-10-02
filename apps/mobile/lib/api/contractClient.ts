import { recordMinSupportedApiVersion } from '@cityborn/client';
import {
  type ContractClient,
  createBearerContractClient,
} from '@cityborn/client/api';
import Constants from 'expo-constants';
import { mobileClientConfig } from '@/config/client';
import { tokenStorage } from '../tokenStorage';
import { getOrCreateVisitorId } from '../visitorId';

export const contractClient: ContractClient = createBearerContractClient(
  mobileClientConfig.restBackendUrl,
  tokenStorage,
  {
    client: { name: 'mobile', version: Constants.expoConfig?.version },
    getVisitorId: getOrCreateVisitorId,
    onResponseHeaders: recordMinSupportedApiVersion,
  },
);
