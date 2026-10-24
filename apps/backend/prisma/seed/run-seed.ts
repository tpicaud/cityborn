import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { prismaEnvironmentConfig } from '../../src/config/prisma.config';
import { seedDatabase } from './seed-database';

async function runSeed(): Promise<void> {
  const prisma: PrismaClient = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: prismaEnvironmentConfig.directUrl,
    }),
  });
  try {
    await seedDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

void runSeed();
