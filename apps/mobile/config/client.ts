import { z } from 'zod';

const mobileClientConfigSchema = z.object({
  webAppUrl: z.string().url(),
  restBackendUrl: z.string().url(),
  websocketBackendUrl: z.string().url(),
  googleOAuthWebClientId: z.string().trim().min(1),
  googleOAuthIosClientId: z.string().trim().min(1),
});

export type MobileClientConfig = z.infer<typeof mobileClientConfigSchema>;

export const mobileClientConfig: MobileClientConfig =
  mobileClientConfigSchema.parse({
    webAppUrl: process.env.EXPO_PUBLIC_WEB_APP_URL,
    restBackendUrl: process.env.EXPO_PUBLIC_REST_BACKEND_URL,
    websocketBackendUrl: process.env.EXPO_PUBLIC_WEBSOCKET_BACKEND_URL,
    googleOAuthWebClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID,
    googleOAuthIosClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID,
  });
