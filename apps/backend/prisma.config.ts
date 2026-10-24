import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { prismaEnvironmentConfig } from './src/config/prisma.config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --swc prisma/seed/run-seed.ts',
  },
  datasource: {
    url: prismaEnvironmentConfig.directUrl,
  },
});
