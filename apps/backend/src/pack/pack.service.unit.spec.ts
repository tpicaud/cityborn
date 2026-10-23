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
  buildUpdatePack,
  ErrorCode,
  GuessObjectIdSchema,
  PackIdSchema,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { GuessObjectService } from '../guess-object/guess-object.service';
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
  const guessObjectService: DeepMocked<GuessObjectService> =
    createMock<GuessObjectService>();
  const packService: PackService = new PackService(
    packRepository,
    guessObjectService,
  );

  return { packRepository, packService, guessObjectService };
}

describe('PackService.findTrees', () => {
  it('loads every pack tree', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const tree: PackTree = { ...buildPack(), children: [] };
    packRepository.findTree.mockResolvedValue([tree]);

    const trees: PackTree[] = await packService.findTrees();

    expect(packRepository.findTree).toHaveBeenCalledWith({});
    expect(trees).toEqual([tree]);
  });
});

describe('PackService.findPublishedTrees', () => {
  it('loads only the published pack trees', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const tree: PackTree = { ...buildPack(), children: [] };
    packRepository.findTree.mockResolvedValue([tree]);

    const trees: PackTree[] = await packService.findPublishedTrees();

    expect(packRepository.findTree).toHaveBeenCalledWith({
      isPublished: true,
    });
    expect(trees).toEqual([tree]);
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

  it('rejects when the pack has children', async () => {
    const { packRepository, packService }: ReturnType<typeof buildPackService> =
      buildPackService();
    const pack: Pack = buildPack();
    packRepository.findFullBy.mockResolvedValue([
      { ...pack, guessObjects: [] },
    ]);
    packRepository.countChildren.mockResolvedValue(1);

    await expect(packService.delete(packId('pack-1'))).rejects.toMatchObject({
      response: { code: ErrorCode.PACK_HAS_CHILDREN },
    });
    expect(packRepository.delete).not.toHaveBeenCalled();
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
    packRepository.countChildren.mockResolvedValue(0);
    packRepository.countByGuessObjectId
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await packService.delete(packId('pack-1'));

    expect(packRepository.delete).toHaveBeenCalledWith(packId('pack-1'));
    expect(guessObjectService.delete).toHaveBeenCalledTimes(1);
    expect(guessObjectService.delete).toHaveBeenCalledWith(orphan.id);
  });
});
