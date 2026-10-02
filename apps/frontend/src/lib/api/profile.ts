import { createProfileApi, type ProfileApi } from '@cityborn/client/profile';
import { contractClient } from './contractClient';

export const profileApi: ProfileApi = createProfileApi(contractClient);
