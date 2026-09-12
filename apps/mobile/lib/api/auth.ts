import { createAuthApi } from '@cityborn/client/auth';
import { client, tokenStorage } from './client';

export const authApi = createAuthApi(client, tokenStorage);
