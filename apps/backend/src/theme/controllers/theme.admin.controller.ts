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
      createTheme: async ({ body }) => ({
        status: 201,
        body: await this.themeService.create(body),
      }),
      updateTheme: async ({ params, body }) => ({
        status: 200,
        body: await this.themeService.update({ id: params.id, theme: body }),
      }),
      deleteTheme: async ({ params }) => {
        await this.themeService.delete(params.id);
        return { status: 200, body: {} };
      },
      getThemes: async () => ({
        status: 200,
        body: await this.themeService.findAll(),
      }),
    });
  }
}
