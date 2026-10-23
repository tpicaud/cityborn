import type {
  CreatePack,
  GuessObject,
  GuessObjectId,
  Pack,
  PackId,
  UpdatePack,
} from '@cityborn/api';
import {
  buildCreatePack,
  buildGuessObject,
  buildPack,
  buildUpdatePack,
  ErrorCode,
  GuessObjectIdSchema,
  PackIdSchema,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { GuessObjectService } from '../../guess-object/guess-object.service';
import type {
  PackFilter,
  PackRepository,
} from '../repositories/pack.repository';
import { PackService } from './pack.service';

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

describe('PackService queries', () => {
  describe('findTree', () => {
    it('delegates tree filters', async () => {
      const {
        packRepository,
        packService,
      }: ReturnType<typeof buildPackService> = buildPackService();
      const filter: PackFilter = { isPublished: false };
      packRepository.findTree.mockResolvedValue([]);

      await packService.findTree(filter);

      expect(packRepository.findTree).toHaveBeenCalledWith({
        isPublished: false,
      });
    });
  });

  describe('findAll', () => {
    it('loads every pack', async () => {
      const {
        packRepository,
        packService,
      }: ReturnType<typeof buildPackService> = buildPackService();
      const pack: Pack = buildPack();
      packRepository.findBy.mockResolvedValue([pack]);

      await expect(packService.findAll()).resolves.toEqual([pack]);
      expect(packRepository.findBy).toHaveBeenCalledWith({});
    });
  });

  describe('findBy', () => {
    it('delegates filtered queries', async () => {
      const {
        packRepository,
        packService,
      }: ReturnType<typeof buildPackService> = buildPackService();
      const filter: PackFilter = {
        ids: [packId('pack-1')],
        isPublished: true,
      };
      packRepository.findBy.mockResolvedValue([]);

      await packService.findBy(filter);

      expect(packRepository.findBy).toHaveBeenCalledWith(filter);
    });
  });

  describe('findFullBy', () => {
    it('delegates full queries', async () => {
      const {
        packRepository,
        packService,
      }: ReturnType<typeof buildPackService> = buildPackService();
      const filter: PackFilter = {
        ids: [packId('pack-1')],
        isPublished: true,
      };
      packRepository.findFullBy.mockResolvedValue([]);

      await packService.findFullBy(filter);

      expect(packRepository.findFullBy).toHaveBeenCalledWith(filter);
    });
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
