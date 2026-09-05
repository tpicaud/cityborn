import { createTestInfrastructure } from './infrastructure';

const infrastructure = createTestInfrastructure();

beforeEach(async () => {
  await infrastructure.reset();
});

afterAll(async () => {
  await infrastructure.close();
});
