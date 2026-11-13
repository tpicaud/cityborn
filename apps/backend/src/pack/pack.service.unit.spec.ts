import type {
  CreatePack,
  FullPack,
  GuessObject,
  GuessObjectId,
  Pack,
  PackId,
  PackTree,
  UpdatePack,
} from '@cityborn/api';
import {
  buildCreatePack,
  buildFullPack,
  buildGuessObject,
  buildPack,
  buildTheme,
  buildUpdatePack,
  ErrorCode,
  GuessObjectIdSchema,
  PackIdSchema,
  type Theme,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import type { GuessObjectService } from '../guess-object/guess-object.service';
import type { ThemeService } from '../theme/theme.service';
import { PackService } from './pack.service';
import type { PackRepository } from './repositories/pack.repository';

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

const packId: (value: string) => PackId = (value: string) =>
  PackIdSchema.parse(value);
const guessObjectId: (value: string) => GuessObjectId = (value: string) =>
  GuessObjectIdSchema.parse(value);

function buildPackService() {
  const packRepository: DeepMocked<PackRepository> =
    createMock<PackRepository>();
  packRepository.findBy.mockResolvedValue([buildPack()]);
  const guessObjectService: DeepMocked<GuessObjectService> =
    createMock<GuessObjectService>();
  const themeService: DeepMocked<ThemeService> = createMock<ThemeService>();
  const packService: PackService = new PackService(
    packRepository,
    guessObjectService,
    themeService,
  );

  return { packRepository, packService, guessObjectService, themeService };
}

describe('PackService.findTrees', () => {
  it('lists every pack as a tree without children', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const pack: Pack = buildPack({ isPublished: false });
    packRepository.findBy.mockResolvedValue([pack]);

    const trees: PackTree[] = await packService.findTrees();

    expect(packRepository.findBy).toHaveBeenCalledWith({});
    expect(trees).toEqual([{ ...pack, children: [] }]);
  });
});

describe('PackService.findPublishedTrees', () => {
  it('lists every published pack as a tree without children', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const monuments: Pack = buildPack({ id: 'pack-1', name: 'Monuments' });
    const museums: Pack = buildPack({ id: 'pack-2', name: 'Musées' });
    packRepository.findBy.mockResolvedValue([monuments, museums]);

    const trees: PackTree[] = await packService.findPublishedTrees();

    expect(packRepository.findBy).toHaveBeenCalledWith({ isPublished: true });
    expect(trees).toEqual([
      { ...monuments, children: [] },
      { ...museums, children: [] },
    ]);
  });
});

describe('PackService.findAll', () => {
  it('loads every pack', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const pack: Pack = buildPack();
    packRepository.findBy.mockResolvedValue([pack]);

    const packs: Pack[] = await packService.findAll();

    expect(packRepository.findBy).toHaveBeenCalledWith({});
    expect(packs).toEqual([pack]);
  });
});

describe('PackService.findPublished', () => {
  it('loads only the published packs', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const pack: Pack = buildPack();
    packRepository.findBy.mockResolvedValue([pack]);

    const packs: Pack[] = await packService.findPublished();

    expect(packRepository.findBy).toHaveBeenCalledWith({ isPublished: true });
    expect(packs).toEqual([pack]);
  });
});

describe('PackService.findById', () => {
  it('returns the pack with this id', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const pack: Pack = buildPack();
    packRepository.findBy.mockResolvedValue([pack]);

    const foundPack: Pack = await packService.findById(pack.id);

    expect(packRepository.findBy).toHaveBeenCalledWith({
      ids: [pack.id],
    });
    expect(foundPack).toEqual(pack);
  });

  it('rejects when the pack does not exist', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    packRepository.findBy.mockResolvedValue([]);

    await expect(packService.findById(packId('missing'))).rejects.toMatchObject(
      { response: { code: ErrorCode.PACK_NOT_FOUND } },
    );
  });
});

describe('PackService.findPublishedById', () => {
  it('looks the pack up among the published packs', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const pack: Pack = buildPack();
    packRepository.findBy.mockResolvedValue([pack]);

    const foundPack: Pack = await packService.findPublishedById(pack.id);

    expect(packRepository.findBy).toHaveBeenCalledWith({
      ids: [pack.id],
      isPublished: true,
    });
    expect(foundPack).toEqual(pack);
  });

  it('rejects when no published pack has this id', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    packRepository.findBy.mockResolvedValue([]);

    await expect(
      packService.findPublishedById(packId('unpublished')),
    ).rejects.toMatchObject({ response: { code: ErrorCode.PACK_NOT_FOUND } });
  });
});

describe('PackService.findFullById', () => {
  it('returns the pack with its guess objects', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const pack: FullPack = buildFullPack();
    packRepository.findFullBy.mockResolvedValue([pack]);

    const foundPack: FullPack = await packService.findFullById(pack.id);

    expect(packRepository.findFullBy).toHaveBeenCalledWith({ ids: [pack.id] });
    expect(foundPack).toEqual(pack);
  });

  it('rejects when the pack does not exist', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    packRepository.findFullBy.mockResolvedValue([]);

    await expect(
      packService.findFullById(packId('missing')),
    ).rejects.toMatchObject({ response: { code: ErrorCode.PACK_NOT_FOUND } });
  });
});

describe('PackService.create', () => {
  it('delegates creation', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const payload: CreatePack = buildCreatePack();
    const pack: Pack = buildPack();
    packRepository.create.mockResolvedValue(pack);

    await expect(packService.create(payload)).resolves.toEqual(pack);
    expect(packRepository.create).toHaveBeenCalledWith(payload);
  });

  it('creates an unpublished pack without image', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const payload: CreatePack = buildCreatePack({
      isPublished: false,
      image: undefined,
    });
    packRepository.create.mockResolvedValue(
      buildPack({ isPublished: false, image: undefined }),
    );

    await packService.create(payload);

    expect(packRepository.create).toHaveBeenCalledWith(payload);
  });

  it('rejects a published pack without image', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const payload: CreatePack = buildCreatePack({
      isPublished: true,
      image: undefined,
    });

    await expect(packService.create(payload)).rejects.toMatchObject({
      response: { code: ErrorCode.PACK_IMAGE_REQUIRED },
    });
    expect(packRepository.create).not.toHaveBeenCalled();
  });
});

describe('PackService.update', () => {
  it('updates fields without scanning for orphans', async () => {
    const {
      packRepository,
      packService,
      guessObjectService,
    }: ReturnType<typeof buildPackService> = buildPackService();
    const payload: UpdatePack = buildUpdatePack({ name: 'Landmarks' });
    const updatedPack: Pack = buildPack(payload);
    packRepository.update.mockResolvedValue(updatedPack);

    await packService.update(packId('pack-1'), payload);

    expect(packRepository.update).toHaveBeenCalledWith(
      packId('pack-1'),
      payload,
    );
    expect(packRepository.countByGuessObjectId).not.toHaveBeenCalled();
    expect(guessObjectService.delete).not.toHaveBeenCalled();
  });

  it('deletes only newly orphaned guess objects', async () => {
    const {
      packRepository,
      packService,
      guessObjectService,
    }: ReturnType<typeof buildPackService> = buildPackService();
    const orphanId: GuessObjectId = guessObjectId('guess-orphan');
    const sharedId: GuessObjectId = guessObjectId('guess-shared');
    const payload: UpdatePack = buildUpdatePack({
      disconnectIds: [orphanId, sharedId],
    });
    const updatedPack: Pack = buildPack();
    packRepository.update.mockResolvedValue(updatedPack);
    packRepository.countByGuessObjectId
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await packService.update(packId('pack-1'), payload);

    expect(guessObjectService.delete).toHaveBeenCalledTimes(1);
    expect(guessObjectService.delete).toHaveBeenCalledWith(orphanId);
  });

  it('removes the previous theme memberships before saving a theme change', async () => {
    const {
      packRepository,
      packService,
      themeService,
    }: ReturnType<typeof buildPackService> = buildPackService();
    const theme: Theme = buildTheme({
      id: '00000000-0000-4000-8000-000000000050',
      name: 'Sport',
    });
    const payload: UpdatePack = buildUpdatePack({ themeId: theme.id });
    themeService.findById.mockResolvedValue(theme);
    packRepository.update.mockResolvedValue(buildPack(payload));

    await packService.update(packId('pack-1'), payload);

    expect(themeService.findById).toHaveBeenCalledWith(theme.id);
    expect(packRepository.lock).toHaveBeenCalledWith(packId('pack-1'));
    expect(packRepository.removeFromThemeSections).toHaveBeenCalledWith({
      packId: packId('pack-1'),
      themeId: buildPack().themeId,
    });
    expect(packRepository.lock.mock.invocationCallOrder[0]).toBeLessThan(
      packRepository.removeFromThemeSections.mock.invocationCallOrder[0],
    );
    expect(
      packRepository.removeFromThemeSections.mock.invocationCallOrder[0],
    ).toBeLessThan(packRepository.update.mock.invocationCallOrder[0]);
    expect(packRepository.update).toHaveBeenCalledWith(
      packId('pack-1'),
      payload,
    );
  });

  it('preserves theme section memberships when saving the same theme', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const payload: UpdatePack = buildUpdatePack();

    await packService.update(packId('pack-1'), payload);

    expect(packRepository.lock).toHaveBeenCalledWith(packId('pack-1'));
    expect(packRepository.removeFromThemeSections).not.toHaveBeenCalled();
  });

  it('rejects an unknown theme without updating the pack', async () => {
    const {
      packRepository,
      packService,
      themeService,
    }: ReturnType<typeof buildPackService> = buildPackService();
    const payload: UpdatePack = buildUpdatePack({
      themeId: '00000000-0000-4000-8000-000000000051',
    });
    themeService.findById.mockRejectedValue(
      new NotFoundException({ code: ErrorCode.THEME_NOT_FOUND }),
    );

    await expect(
      packService.update(packId('pack-1'), payload),
    ).rejects.toMatchObject({ response: { code: ErrorCode.THEME_NOT_FOUND } });
    expect(packRepository.update).not.toHaveBeenCalled();
  });

  it('publishes a pack whose stored image the update keeps', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const storedPack: Pack = buildPack({ isPublished: false });
    const payload: UpdatePack = buildUpdatePack({
      isPublished: true,
      image: undefined,
    });
    packRepository.findBy.mockResolvedValue([storedPack]);
    packRepository.update.mockResolvedValue({
      ...storedPack,
      isPublished: true,
    });

    await packService.update(packId('pack-1'), payload);

    expect(packRepository.findBy).toHaveBeenCalledWith({
      ids: [packId('pack-1')],
    });
    expect(packRepository.update).toHaveBeenCalledWith(
      packId('pack-1'),
      payload,
    );
  });

  it('rejects publishing a pack that has no image', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const payload: UpdatePack = buildUpdatePack({
      isPublished: true,
      image: undefined,
    });
    packRepository.findBy.mockResolvedValue([
      buildPack({ isPublished: false, image: undefined }),
    ]);

    await expect(
      packService.update(packId('pack-1'), payload),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.PACK_IMAGE_REQUIRED },
    });
    expect(packRepository.update).not.toHaveBeenCalled();
  });

  it('saves an unpublished pack without image', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const payload: UpdatePack = buildUpdatePack({
      isPublished: false,
      image: undefined,
    });
    packRepository.update.mockResolvedValue(
      buildPack({ isPublished: false, image: undefined }),
    );

    await packService.update(packId('pack-1'), payload);

    expect(packRepository.update).toHaveBeenCalledWith(
      packId('pack-1'),
      payload,
    );
  });

  it('keeps the theme unchecked when the update does not change it', async () => {
    const {
      packRepository,
      packService,
      themeService,
    }: ReturnType<typeof buildPackService> = buildPackService();
    const payload: UpdatePack = buildUpdatePack({ themeId: undefined });
    packRepository.update.mockResolvedValue(buildPack());

    await packService.update(packId('pack-1'), payload);

    expect(themeService.findById).not.toHaveBeenCalled();
  });
});

describe('PackService.delete', () => {
  it('rejects when the pack does not exist', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    packRepository.findFullBy.mockResolvedValue([]);

    await expect(packService.delete(packId('missing'))).rejects.toMatchObject({
      response: { code: ErrorCode.PACK_NOT_FOUND },
    });
  });

  it('deletes the pack and only its orphaned guess objects', async () => {
    const {
      packRepository,
      packService,
      guessObjectService,
    }: ReturnType<typeof buildPackService> = buildPackService();
    const orphan: GuessObject = buildGuessObject({ id: 'guess-orphan' });
    const shared: GuessObject = buildGuessObject({ id: 'guess-shared' });
    const pack: Pack = buildPack();
    packRepository.findFullBy.mockResolvedValue([
      { ...pack, guessObjects: [orphan, shared] },
    ]);
    packRepository.countByGuessObjectId
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await packService.delete(packId('pack-1'));

    expect(packRepository.delete).toHaveBeenCalledWith(packId('pack-1'));
    expect(guessObjectService.delete).toHaveBeenCalledTimes(1);
    expect(guessObjectService.delete).toHaveBeenCalledWith(orphan.id);
  });
});
