import type { Pack, PackId, PackTree } from '@cityborn/api';
import { buildPack, PackIdSchema } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { PackFilter } from '../repositories/pack.repository';
import { PublicPackService } from './pack.public.service';
import type { PackService } from './pack.service';

const packId: (value: string) => PackId = (value: string) =>
  PackIdSchema.parse(value);

function buildPublicPackService() {
  const packService: DeepMocked<PackService> = createMock<PackService>();
  const publicPackService: PublicPackService = new PublicPackService(
    packService,
  );

  return { publicPackService, packService };
}

describe('PublicPackService.findAll', () => {
  it('loads only published packs', async () => {
    const {
      publicPackService,
      packService,
    }: ReturnType<typeof buildPublicPackService> = buildPublicPackService();
    const pack: Pack = buildPack();
    packService.findBy.mockResolvedValue([pack]);

    const packs: Pack[] = await publicPackService.findAll();

    expect(packService.findBy).toHaveBeenCalledWith({ isPublished: true });
    expect(packs).toHaveLength(1);
  });
});

describe('PublicPackService.findBy', () => {
  it('enforces the published filter', async () => {
    const {
      publicPackService,
      packService,
    }: ReturnType<typeof buildPublicPackService> = buildPublicPackService();
    const pack: Pack = buildPack();
    const filter: PackFilter = { ids: [packId('pack-1')] };
    packService.findBy.mockResolvedValue([pack]);

    const packs: Pack[] = await publicPackService.findBy(filter);

    expect(packService.findBy).toHaveBeenCalledWith({
      ids: ['pack-1'],
      isPublished: true,
    });
    expect(packs[0]?.isPublished).toBe(true);
  });
});

describe('PublicPackService.getTrees', () => {
  it('loads only published root trees', async () => {
    const {
      publicPackService,
      packService,
    }: ReturnType<typeof buildPublicPackService> = buildPublicPackService();
    const pack: Pack = buildPack();
    const root: PackTree = {
      ...pack,
      children: [],
    };
    packService.findTree.mockResolvedValue([root]);

    const trees: PackTree[] = await publicPackService.getTrees();

    expect(packService.findTree).toHaveBeenCalledWith({
      isPublished: true,
    });
    expect(trees.map(({ id }) => id)).toEqual([root.id]);
  });
});
