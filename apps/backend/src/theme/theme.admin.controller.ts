import { contract } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AdminGuard } from '../auth/guards/access-token.guard';
import { ThemeService } from './theme.service';

@UseGuards(AdminGuard)
@Controller()
export class AdminThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @TsRestHandler(contract.admin.theme)
  async handler() {
    return tsRestHandler(contract.admin.theme, {
      getThemes: async () => ({
        status: 200 as const,
        body: await this.themeService.findAll(),
      }),
    });
  }
}
