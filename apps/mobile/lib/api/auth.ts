import { type AuthApi, createAuthApi } from '@cityborn/client/auth';
import { clearGoogleSession } from '../googleSignIn';
import { tokenStorage } from '../tokenStorage';
import { contractClient } from './contractClient';

const bearerAuthApi: AuthApi = createAuthApi(contractClient, tokenStorage);

export const authApi: AuthApi = {
  ...bearerAuthApi,
  async signOut(): Promise<void> {
    try {
      await bearerAuthApi.signOut();
    } finally {
      await clearGoogleSession().catch(() => undefined);
    }
  },
};
