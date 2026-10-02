import { type AuthApi, createAuthApi } from '@cityborn/client/auth';
import { tokenStorage } from '../tokenStorage';
import { contractClient } from './contractClient';

export const authApi: AuthApi = createAuthApi(contractClient, tokenStorage);
