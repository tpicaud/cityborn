import { type AuthApi, createCookieAuthApi } from '@cityborn/client/auth';
import { contractClient } from './contract-client';

export const authApi: AuthApi = createCookieAuthApi(contractClient);
