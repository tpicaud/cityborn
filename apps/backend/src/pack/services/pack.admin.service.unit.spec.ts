import type {
  CreatePack,
  FullPack,
  Pack,
  PackId,
  PackTree,
  UpdatePack,
} from '@cityborn/api';
import {
  buildCreatePack,
  buildPack,
  buildUpdatePack,
  ErrorCode,
  PackIdSchema,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { PackFilter } from '../repositories/pack.repository';
import { AdminPackService } from './pack.admin.service';
import type { PackService } from './pack.service';

const packId: (value: string) => PackId = (value: string) =>
  PackIdSchema.parse(value);

function buildAdminPackService() {
  const packService: DeepMocked<PackService> = createMock<PackService>();
  const adminPackService: AdminPackService = new AdminPackService(packService);

  return { adminPackService, packService };
}

describe('AdminPackService.findAll', () => {
  it('returns every mapped pack', async () => {
    const {
      adminPackService,
      packService,
    }: ReturnType<typeof buildAdminPackService> = buildAdminPackService();
    const pack: Pack = buildPack();
    const otherPack: Pack = buildPack({ id: 'pack-2' });
    packService.findAll.mockResolvedValue([pack, otherPack]);

    const packs: Pack[] = await adminPackService.findAll();

    expect(packs.map(({ id }) => id)).toEqual([
      '00000000-0000-4000-8000-000000000010',
      'pack-2',
    ]);
  });
});

describe('AdminPackService.findBy', () => {
  it('forwards the filter and returns mapped packs', async () => {
    const {
      adminPackService,
      packService,
    }: ReturnType<typeof buildAdminPackService> = buildAdminPackService();
    const pack: Pack = buildPack();
    const filter: PackFilter = { ids: [packId('pack-1')] };
    packService.findBy.mockResolvedValue([pack]);

    const packs: Pack[] = await adminPackService.findBy(filter);

    expect(packService.findBy).toHaveBeenCalledWith({
      ids: [packId('pack-1')],
    });
    expect(packs).toHaveLength(1);
  });
});

describe('AdminPackService.findFullBy', () => {
  it('returns the mapped full pack', async () => {
    const {
      adminPackService,
      packService,
    }: ReturnType<typeof buildAdminPackService> = buildAdminPackService();
    const pack: Pack = buildPack();
    packService.findFullBy.mockResolvedValue([{ ...pack, guessObjects: [] }]);

    const result: FullPack = await adminPackService.findFullBy(
      packId('pack-1'),
    );

    expect(result.guessObjects).toEqual([]);
  });

  it('rejects when the pack does not exist', async () => {
    const {
      adminPackService,
      packService,
    }: ReturnType<typeof buildAdminPackService> = buildAdminPackService();
    packService.findFullBy.mockResolvedValue([]);

    await expect(
      adminPackService.findFullBy(packId('missing')),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.PACK_NOT_FOUND },
    });
  });
});

describe('AdminPackService.create', () => {
  it('creates and maps a pack', async () => {
    const {
      adminPackService,
      packService,
    }: ReturnType<typeof buildAdminPackService> = buildAdminPackService();
    const pack: Pack = buildPack();
    packService.create.mockResolvedValue(pack);
    const payload: CreatePack = buildCreatePack();

    const result: Pack = await adminPackService.create(payload);

    expect(packService.create).toHaveBeenCalledWith(payload);
    expect(result.name).toBe('Monuments');
  });
});

describe('AdminPackService.update', () => {
  it('updates and maps a pack', async () => {
    const {
      adminPackService,
      packService,
    }: ReturnType<typeof buildAdminPackService> = buildAdminPackService();
    const pack: Pack = buildPack();
    packService.update.mockResolvedValue({
      ...pack,
      name: 'Landmarks',
    });
    const payload: UpdatePack = buildUpdatePack({ name: 'Landmarks' });

    const result: Pack = await adminPackService.update(
      packId('pack-1'),
      payload,
    );

    expect(packService.update).toHaveBeenCalledWith(packId('pack-1'), payload);
    expect(result.name).toBe('Landmarks');
  });
});

describe('AdminPackService.delete', () => {
  it('delegates deletion', async () => {
    const {
      adminPackService,
      packService,
    }: ReturnType<typeof buildAdminPackService> = buildAdminPackService();
    packService.delete.mockResolvedValue(undefined);

    await adminPackService.delete(packId('pack-1'));

    expect(packService.delete).toHaveBeenCalledWith(packId('pack-1'));
  });
});

describe('AdminPackService.getTrees', () => {
  it('returns mapped root trees', async () => {
    const {
      adminPackService,
      packService,
    }: ReturnType<typeof buildAdminPackService> = buildAdminPackService();
    const pack: Pack = buildPack();
    const root: PackTree = {
      ...pack,
      children: [],
    };
    packService.findTree.mockResolvedValue([root]);

    const trees: PackTree[] = await adminPackService.getTrees();

    expect(packService.findTree).toHaveBeenCalledWith({});
    expect(trees.map(({ id }) => id)).toEqual([root.id]);
  });
});
