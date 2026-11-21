import { z } from 'zod';

const frontendClientConfigSchema = z.object({
  googleMapsApiKey: z.string().trim().min(1),
  webAppUrl: z.string().url(),
  restBackendUrl: z.string().url(),
  websocketBackendUrl: z.string().url().default('ws://localhost:4000'),
  googleOAuthWebClientId: z.string().trim().min(1),
});

export type FrontendClientConfig = z.infer<typeof frontendClientConfigSchema>;

export const frontendClientConfig: FrontendClientConfig =
  frontendClientConfigSchema.parse({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY,
    webAppUrl: process.env.NEXT_PUBLIC_WEB_APP_URL,
    restBackendUrl: process.env.NEXT_PUBLIC_REST_BACKEND_URL,
    websocketBackendUrl: process.env.NEXT_PUBLIC_WEBSOCKET_BACKEND_URL,
    googleOAuthWebClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  });
