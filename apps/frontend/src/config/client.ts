import { z } from 'zod';

const frontendClientConfigSchema = z.object({
  googleMapsApiKey: z.string().trim().min(1),
  websocketBackendUrl: z.string().url().default('ws://localhost:3001'),
  googleClientId: z.string().trim().min(1),
});

export type FrontendClientConfig = z.infer<typeof frontendClientConfigSchema>;

export const frontendClientConfig: FrontendClientConfig =
  frontendClientConfigSchema.parse({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY,
    websocketBackendUrl: process.env.NEXT_PUBLIC_WEBSOCKET_BACKEND_URL,
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  });
