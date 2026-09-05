import { createTestInfrastructure } from './infrastructure';

export default async function globalTeardown() {
  const infrastructure = createTestInfrastructure();

  try {
    await infrastructure.reset();
  } finally {
    await infrastructure.close();
  }
}
