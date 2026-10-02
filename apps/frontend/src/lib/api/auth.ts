import { type AuthApi, createCookieAuthApi } from '@cityborn/client/auth';
import { contractClient } from './contractClient';

export const authApi: AuthApi = createCookieAuthApi(contractClient);
