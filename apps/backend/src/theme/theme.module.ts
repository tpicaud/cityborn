import { Module } from '@nestjs/common';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { PrismaThemeRepository } from './repositories/prisma-theme.repository';
import { THEME_REPOSITORY } from './repositories/theme.repository';
import { AdminThemeController } from './theme.admin.controller';
import { ThemeService } from './theme.service';

@Module({
  imports: [PrismaClsModule],
  controllers: [AdminThemeController],
  providers: [
    ThemeService,
    { provide: THEME_REPOSITORY, useClass: PrismaThemeRepository },
  ],
  exports: [ThemeService],
})
export class ThemeModule {}
