import {
  type AdminTheme,
  buildAdminTheme,
  buildTheme,
  ErrorCode,
  type Theme,
  type ThemeIconName,
  ThemeIconNameSchema,
  ThemeMoveDirection,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { IconService } from '../icon/icon.service';
import { defaultThemeIcon } from './default-theme';
import {
  ThemeHasPacksError,
  ThemeNameAlreadyExistsError,
  type ThemeRepository,
} from './repositories/theme.repository';
import { ThemeService } from './theme.service';

function buildThemeService() {
  const themeRepository: DeepMocked<ThemeRepository> =
    createMock<ThemeRepository>();
  const iconService: DeepMocked<IconService> = createMock<IconService>();
  const themeService: ThemeService = new ThemeService(
    themeRepository,
    iconService,
  );

  return { themeRepository, iconService, themeService };
}

const musicIconName: ThemeIconName = ThemeIconNameSchema.parse(
  'boxicons:music-alt-filled',
);
const musicIconSvg: string = '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>';

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

jest.mock('@nestjs-cls/transactional', () => ({
  Transactional:
    () =>
    (
      _target: object,
      _propertyKey: string | symbol,
      descriptor: PropertyDescriptor,
    ) =>
      descriptor,
}));
describe('ThemeService.create', () => {
  it('gives the default icon to a theme created without icon', async () => {
    const {
      themeRepository,
      iconService,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();

    await themeService.create({ name: 'Cinéma' });

    expect(themeRepository.create).toHaveBeenCalledWith({
      name: 'Cinéma',
      icon: defaultThemeIcon,
    });
    expect(iconService.findSvg).not.toHaveBeenCalled();
  });
  it('stores the drawing of the chosen icon', async () => {
    const {
      themeRepository,
      iconService,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    iconService.findSvg.mockResolvedValue(musicIconSvg);

    await themeService.create({ name: 'Musique', icon: musicIconName });

    expect(themeRepository.create).toHaveBeenCalledWith({
      name: 'Musique',
      icon: { name: musicIconName, svg: musicIconSvg },
    });
  });
  it('rejects an unknown icon', async () => {
    const {
      themeRepository,
      iconService,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    iconService.findSvg.mockResolvedValue(null);

    await expect(
      themeService.create({ name: 'Musique', icon: musicIconName }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.THEME_ICON_NOT_FOUND },
    });
    expect(themeRepository.create).not.toHaveBeenCalled();
  });
  it('translates a name conflict', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    themeRepository.create.mockRejectedValue(new ThemeNameAlreadyExistsError());

    await expect(themeService.create({ name: 'sport' })).rejects.toMatchObject({
      response: { code: ErrorCode.THEME_NAME_ALREADY_EXISTS },
    });
  });
});
describe('ThemeService.update', () => {
  it('replaces the icon with its drawing', async () => {
    const {
      themeRepository,
      iconService,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    const theme: Theme = buildTheme();
    themeRepository.findById.mockResolvedValue(theme);
    iconService.findSvg.mockResolvedValue(musicIconSvg);

    await themeService.update({
      id: theme.id,
      theme: { name: theme.name, icon: musicIconName },
    });

    expect(themeRepository.update).toHaveBeenCalledWith({
      id: theme.id,
      theme: {
        name: theme.name,
        icon: { name: musicIconName, svg: musicIconSvg },
      },
    });
  });
  it('keeps the stored drawing when the icon is unchanged', async () => {
    const {
      themeRepository,
      iconService,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    const theme: Theme = buildTheme();
    themeRepository.findById.mockResolvedValue(theme);

    await themeService.update({
      id: theme.id,
      theme: { name: 'Autres', icon: theme.icon.name },
    });

    expect(iconService.findSvg).not.toHaveBeenCalled();
    expect(themeRepository.update).toHaveBeenCalledWith({
      id: theme.id,
      theme: { name: 'Autres', icon: undefined },
    });
  });
  it('allows renaming the default theme', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    const theme: Theme = buildTheme({ name: 'Autres' });
    themeRepository.findById.mockResolvedValue(buildTheme());
    themeRepository.update.mockResolvedValue(theme);

    await expect(
      themeService.update({ id: theme.id, theme: { name: 'Autres' } }),
    ).resolves.toEqual(theme);
  });
  it('rejects renaming an unknown theme', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    themeRepository.findById.mockResolvedValue(null);

    await expect(
      themeService.update({ id: buildTheme().id, theme: { name: 'Sport' } }),
    ).rejects.toMatchObject({ response: { code: ErrorCode.THEME_NOT_FOUND } });
  });
  it('translates a name conflict during renaming', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    const theme: Theme = buildTheme();
    themeRepository.findById.mockResolvedValue(theme);
    themeRepository.update.mockRejectedValue(new ThemeNameAlreadyExistsError());

    await expect(
      themeService.update({ id: theme.id, theme: { name: 'sport' } }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.THEME_NAME_ALREADY_EXISTS },
    });
  });
});
describe('ThemeService.delete', () => {
  it('protects the default theme after renaming', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    const theme: Theme = buildTheme({ name: 'Autres' });
    themeRepository.findById.mockResolvedValue(theme);

    await expect(themeService.delete(theme.id)).rejects.toMatchObject({
      response: { code: ErrorCode.THEME_DEFAULT_NOT_DELETABLE },
    });
    expect(themeRepository.delete).not.toHaveBeenCalled();
  });
  it('rejects a theme with attached packs', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    const theme: Theme = buildTheme({
      id: '00000000-0000-4000-8000-000000000050',
    });
    themeRepository.findById.mockResolvedValue(theme);
    themeRepository.countPacks.mockResolvedValue(3);

    await expect(themeService.delete(theme.id)).rejects.toMatchObject({
      response: { code: ErrorCode.THEME_HAS_PACKS },
    });
    expect(themeRepository.delete).not.toHaveBeenCalled();
  });
  it('translates a pack attached concurrently', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    const theme: Theme = buildTheme({
      id: '00000000-0000-4000-8000-000000000050',
    });
    themeRepository.findById.mockResolvedValue(theme);
    themeRepository.countPacks.mockResolvedValue(0);
    themeRepository.delete.mockRejectedValue(new ThemeHasPacksError());

    await expect(themeService.delete(theme.id)).rejects.toMatchObject({
      response: { code: ErrorCode.THEME_HAS_PACKS },
    });
  });
  it('deletes an unused theme', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    const theme: Theme = buildTheme({
      id: '00000000-0000-4000-8000-000000000050',
    });
    themeRepository.findById.mockResolvedValue(theme);
    themeRepository.countPacks.mockResolvedValue(0);

    await themeService.delete(theme.id);

    expect(themeRepository.delete).toHaveBeenCalledWith(theme.id);
  });
});
describe('ThemeService.move', () => {
  const sport: AdminTheme = buildAdminTheme({
    id: '00000000-0000-4000-8000-000000000050',
    name: 'Sport',
    isDefault: false,
  });
  const music: AdminTheme = buildAdminTheme({
    id: '00000000-0000-4000-8000-000000000051',
    name: 'Musique',
    isDefault: false,
  });
  const miscellaneous: AdminTheme = buildAdminTheme();

  it('swaps a theme with the previous one', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    themeRepository.findAll.mockResolvedValue([sport, music, miscellaneous]);

    const themes: AdminTheme[] = await themeService.move({
      id: music.id,
      direction: ThemeMoveDirection.UP,
    });

    expect(themes).toEqual([music, sport, miscellaneous]);
    expect(themeRepository.reorder).toHaveBeenCalledWith([
      music.id,
      sport.id,
      miscellaneous.id,
    ]);
  });

  it('swaps a theme with the next one', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    themeRepository.findAll.mockResolvedValue([sport, music, miscellaneous]);

    const themes: AdminTheme[] = await themeService.move({
      id: music.id,
      direction: ThemeMoveDirection.DOWN,
    });

    expect(themes).toEqual([sport, miscellaneous, music]);
    expect(themeRepository.reorder).toHaveBeenCalledWith([
      sport.id,
      miscellaneous.id,
      music.id,
    ]);
  });

  it('keeps the order when the theme is already at the edge', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    themeRepository.findAll.mockResolvedValue([sport, music]);

    const themes: AdminTheme[] = await themeService.move({
      id: sport.id,
      direction: ThemeMoveDirection.UP,
    });

    expect(themes).toEqual([sport, music]);
    expect(themeRepository.reorder).not.toHaveBeenCalled();
  });

  it('rejects an unknown theme', async () => {
    const {
      themeRepository,
      themeService,
    }: ReturnType<typeof buildThemeService> = buildThemeService();
    themeRepository.findAll.mockResolvedValue([sport]);

    await expect(
      themeService.move({ id: music.id, direction: ThemeMoveDirection.DOWN }),
    ).rejects.toMatchObject({ response: { code: ErrorCode.THEME_NOT_FOUND } });
  });
});
