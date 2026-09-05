import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/configure-app';

export async function createTestApp(
  customize?: (builder: TestingModuleBuilder) => void,
): Promise<NestExpressApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  customize?.(builder);
  const module = await builder.compile();
  const app = module.createNestApplication<NestExpressApplication>({
    bufferLogs: true,
  });

  let initialized = false;
  try {
    await configureApp(app);
    await app.init();
    initialized = true;
    return app;
  } finally {
    if (!initialized) await app.close();
  }
}
