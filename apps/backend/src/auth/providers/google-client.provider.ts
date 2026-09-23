import type { Provider } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';

export const GoogleClientProvider: Provider = {
  provide: 'GOOGLE_CLIENT',
  inject: [AUTH_CONFIG],
  useFactory: (authConfig: AuthConfig): OAuth2Client => {
    return new OAuth2Client(authConfig.googleClientId);
  },
};
