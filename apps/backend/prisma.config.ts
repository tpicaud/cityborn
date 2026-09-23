import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { prismaEnvironmentConfig } from './src/config/prisma.config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: prismaEnvironmentConfig.directUrl,
  },
});
