import { z } from 'zod';

const backOfficeClientConfigSchema = z.object({
  googleMapsApiKey: z.string().trim().min(1),
  restBackendUrl: z.string().url(),
});

export type BackOfficeClientConfig = z.infer<
  typeof backOfficeClientConfigSchema
>;

export const backOfficeClientConfig: BackOfficeClientConfig =
  backOfficeClientConfigSchema.parse({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    restBackendUrl: process.env.NEXT_PUBLIC_REST_BACKEND_URL,
  });
