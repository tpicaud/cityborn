import { type AuthApi, createCookieAuthApi } from '@cityborn/client/auth';
import { apiClient } from './client';

export const authApi: AuthApi = createCookieAuthApi(apiClient);
