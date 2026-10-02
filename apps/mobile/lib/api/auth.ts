import { type AuthApi, createAuthApi } from '@cityborn/client/auth';
import { contractClient, tokenStorage } from './contractClient';

export const authApi: AuthApi = createAuthApi(contractClient, tokenStorage);
