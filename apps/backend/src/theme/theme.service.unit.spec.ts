import { buildTheme, ErrorCode, type Theme } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { ThemeRepository } from './repositories/theme.repository';
import { ThemeService } from './theme.service';

function buildThemeService() {
  const themeRepository: DeepMocked<ThemeRepository> =
    createMock<ThemeRepository>();
  const themeService: ThemeService = new ThemeService(themeRepository);

  return { themeRepository, themeService };
}

describe('ThemeService.findById', () => {
  it('returns the requested theme', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    const theme: Theme = buildTheme();
    themeRepository.findById.mockResolvedValue(theme);

    const foundTheme: Theme = await themeService.findById(theme.id);

    expect(foundTheme).toEqual(theme);
  });

  it('rejects an unknown theme', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    const theme: Theme = buildTheme();
    themeRepository.findById.mockResolvedValue(null);

    await expect(themeService.findById(theme.id)).rejects.toMatchObject({
      response: { code: ErrorCode.THEME_NOT_FOUND },
    });
  });
});
