import 'dotenv/config';
import { z } from 'zod';

const prismaEnvironmentSchema = z.object({
  directUrl: z.preprocess(
    (value: unknown) => (value === '' ? undefined : value),
    z.string().url().default('postgresql://localhost:5432/dummy'),
  ),
});

export interface PrismaEnvironmentConfig {
  directUrl: string;
}

export function parsePrismaEnvironmentConfig(
  environment: NodeJS.ProcessEnv,
): PrismaEnvironmentConfig {
  const config: PrismaEnvironmentConfig = prismaEnvironmentSchema.parse({
    directUrl: environment.DIRECT_URL,
  });
  return config;
}

export const prismaEnvironmentConfig: PrismaEnvironmentConfig =
  parsePrismaEnvironmentConfig(process.env);
