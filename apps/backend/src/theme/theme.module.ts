import { Module } from '@nestjs/common';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { AdminThemeController } from './controllers/theme.admin.controller';
import { PublicThemeController } from './controllers/theme.public.controller';
import { PrismaThemeRepository } from './repositories/prisma-theme.repository';
import { THEME_REPOSITORY } from './repositories/theme.repository';
import { ThemeService } from './theme.service';

@Module({
  imports: [PrismaClsModule],
  controllers: [PublicThemeController, AdminThemeController],
  providers: [
    ThemeService,
    { provide: THEME_REPOSITORY, useClass: PrismaThemeRepository },
  ],
  exports: [ThemeService],
})
export class ThemeModule {}
