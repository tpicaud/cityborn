import { contract } from '@cityborn/api';
import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { ThemeService } from '../theme.service';

@Controller()
export class PublicThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @TsRestHandler(contract.theme)
  async handler() {
    return tsRestHandler(contract.theme, {
      getPlayableThemes: async () => ({
        status: 200,
        body: await this.themeService.findPlayable(),
      }),
    });
  }
}
