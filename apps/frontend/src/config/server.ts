import 'server-only';
import { z } from 'zod';

const frontendServerConfigSchema = z.object({
  nodeEnvironment: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  domainName: z.string().trim().min(1),
  restBackendUrl: z.string().url(),
});

export type FrontendServerConfig = z.infer<typeof frontendServerConfigSchema>;

let frontendServerConfig: FrontendServerConfig | undefined;

export function getFrontendServerConfig(): FrontendServerConfig {
  if (frontendServerConfig) return frontendServerConfig;

  frontendServerConfig = frontendServerConfigSchema.parse({
    nodeEnvironment: process.env.NODE_ENV,
    domainName: process.env.DOMAIN_NAME,
    restBackendUrl: process.env.REST_BACKEND_URL,
  });
  return frontendServerConfig;
}
