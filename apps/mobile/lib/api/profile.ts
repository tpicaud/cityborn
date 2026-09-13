import { createProfileApi } from '@cityborn/client/profile';
import { client } from './client';

export const profileApi = createProfileApi(client);
