import 'server-only';
import { z } from 'zod';

const backOfficeServerConfigSchema = z.object({
  nodeEnvironment: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  port: z.coerce.number().int().positive().default(3001),
  authSecret: z.string().trim().min(1),
  adminPassword: z.string().trim().min(1),
  backendUrl: z.string().url(),
  adminDashboardToken: z.string().trim().min(1),
});

export type BackOfficeServerConfig = z.infer<
  typeof backOfficeServerConfigSchema
>;

let backOfficeServerConfig: BackOfficeServerConfig | undefined;

export function getBackOfficeServerConfig(): BackOfficeServerConfig {
  if (backOfficeServerConfig) return backOfficeServerConfig;

  backOfficeServerConfig = backOfficeServerConfigSchema.parse({
    nodeEnvironment: process.env.NODE_ENV,
    port: process.env.PORT,
    authSecret: process.env.AUTH_SECRET,
    adminPassword: process.env.ADMIN_PASSWORD,
    backendUrl: process.env.BACKEND_URL,
    adminDashboardToken: process.env.ADMIN_DASHBOARD_TOKEN,
  });
  return backOfficeServerConfig;
}
