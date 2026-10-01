import { createProfileApi, type ProfileApi } from '@cityborn/client/profile';
import { apiClient } from './client';

export const profileApi: ProfileApi = createProfileApi(apiClient);
