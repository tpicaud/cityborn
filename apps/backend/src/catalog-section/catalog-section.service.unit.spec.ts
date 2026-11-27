import {
  buildCatalogSection,
  buildPack,
  type CatalogSection,
  CatalogSectionMoveDirection,
  ErrorCode,
  type Pack,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import type { PackService } from '../pack/pack.service';
import { CatalogSectionService } from './catalog-section.service';
import { defaultCatalogSectionId } from './default-catalog-section';
import {
  CatalogSectionNameAlreadyExistsError,
  type CatalogSectionRepository,
} from './repositories/catalog-section.repository';

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

function buildCatalogSectionService() {
  const catalogSectionRepository: DeepMocked<CatalogSectionRepository> =
    createMock<CatalogSectionRepository>();
  const packService: DeepMocked<PackService> = createMock<PackService>();
  const catalogSectionService: CatalogSectionService =
    new CatalogSectionService(catalogSectionRepository, packService);

  return { catalogSectionRepository, packService, catalogSectionService };
}

const news: CatalogSection = buildCatalogSection({
  id: '00000000-0000-4000-8000-000000000060',
  name: 'Nouveautés',
});
const events: CatalogSection = buildCatalogSection({
  id: '00000000-0000-4000-8000-000000000061',
  name: 'Évènements',
});
const classics: CatalogSection = buildCatalogSection({
  id: '00000000-0000-4000-8000-000000000062',
  name: 'Classiques',
});

describe('CatalogSectionService.create', () => {
  it('translates a name conflict', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.create.mockRejectedValue(
      new CatalogSectionNameAlreadyExistsError(),
    );

    await expect(
      catalogSectionService.create({ name: 'évènements' }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_NAME_ALREADY_EXISTS },
    });
  });
});

describe('CatalogSectionService.rename', () => {
  it('returns the renamed section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.rename.mockResolvedValue({
      ...events,
      name: 'Événements',
    });

    const section: CatalogSection = await catalogSectionService.rename({
      id: events.id,
      section: { name: 'Événements' },
    });

    expect(section).toEqual({
      id: events.id,
      name: 'Événements',
      isDefault: false,
      packIds: [],
    });
    expect(catalogSectionRepository.rename).toHaveBeenCalledWith({
      id: events.id,
      name: 'Événements',
    });
  });

  it('rejects an unknown section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.rename.mockResolvedValue(null);

    await expect(
      catalogSectionService.rename({
        id: events.id,
        section: { name: 'Événements' },
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_NOT_FOUND },
    });
  });

  it('translates a name conflict', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.rename.mockRejectedValue(
      new CatalogSectionNameAlreadyExistsError(),
    );

    await expect(
      catalogSectionService.rename({
        id: events.id,
        section: { name: 'NOUVEAUTÉS' },
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_NAME_ALREADY_EXISTS },
    });
  });
});

describe('CatalogSectionService.move', () => {
  it('swaps a section with the previous one', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.findAll.mockResolvedValue([
      news,
      events,
      classics,
    ]);

    const sections: CatalogSection[] = await catalogSectionService.move({
      id: events.id,
      direction: CatalogSectionMoveDirection.UP,
    });

    expect(sections).toEqual([events, news, classics]);
    expect(catalogSectionRepository.reorder).toHaveBeenCalledWith([
      events.id,
      news.id,
      classics.id,
    ]);
  });

  it('swaps a section with the next one', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.findAll.mockResolvedValue([
      news,
      events,
      classics,
    ]);

    const sections: CatalogSection[] = await catalogSectionService.move({
      id: events.id,
      direction: CatalogSectionMoveDirection.DOWN,
    });

    expect(sections).toEqual([news, classics, events]);
    expect(catalogSectionRepository.reorder).toHaveBeenCalledWith([
      news.id,
      classics.id,
      events.id,
    ]);
  });

  it('keeps the order when the section is already at the edge', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.findAll.mockResolvedValue([news, events]);

    const sections: CatalogSection[] = await catalogSectionService.move({
      id: events.id,
      direction: CatalogSectionMoveDirection.DOWN,
    });

    expect(sections).toEqual([news, events]);
    expect(catalogSectionRepository.reorder).not.toHaveBeenCalled();
  });

  it('rejects an unknown section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.findAll.mockResolvedValue([news]);

    await expect(
      catalogSectionService.move({
        id: events.id,
        direction: CatalogSectionMoveDirection.UP,
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_NOT_FOUND },
    });
  });
});

describe('CatalogSectionService.delete', () => {
  it('deletes an existing section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.delete.mockResolvedValue(true);

    await catalogSectionService.delete(events.id);

    expect(catalogSectionRepository.delete).toHaveBeenCalledWith(events.id);
  });

  it('rejects an unknown section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.delete.mockResolvedValue(false);

    await expect(catalogSectionService.delete(events.id)).rejects.toMatchObject(
      {
        response: { code: ErrorCode.CATALOG_SECTION_NOT_FOUND },
      },
    );
  });

  it('rejects the default section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();

    await expect(
      catalogSectionService.delete(defaultCatalogSectionId),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_DEFAULT_NOT_DELETABLE },
    });
    expect(catalogSectionRepository.delete).not.toHaveBeenCalled();
  });
});

describe('CatalogSectionService.addPack', () => {
  const pack: Pack = buildPack();

  it('returns the section with the added pack', async () => {
    const {
      catalogSectionRepository,
      packService,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    packService.findById.mockResolvedValue(pack);
    catalogSectionRepository.addPack.mockResolvedValue({
      ...events,
      packIds: [pack.id],
    });

    const section: CatalogSection = await catalogSectionService.addPack({
      id: events.id,
      packId: pack.id,
    });

    expect(section).toEqual({ ...events, packIds: [pack.id] });
  });

  it('rejects an unknown pack', async () => {
    const {
      catalogSectionRepository,
      packService,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    packService.findById.mockRejectedValue(
      new NotFoundException({ code: ErrorCode.PACK_NOT_FOUND }),
    );

    await expect(
      catalogSectionService.addPack({ id: events.id, packId: pack.id }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.PACK_NOT_FOUND },
    });
    expect(catalogSectionRepository.addPack).not.toHaveBeenCalled();
  });

  it('rejects an unknown section', async () => {
    const {
      catalogSectionRepository,
      packService,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    packService.findById.mockResolvedValue(pack);
    catalogSectionRepository.addPack.mockResolvedValue(null);

    await expect(
      catalogSectionService.addPack({ id: events.id, packId: pack.id }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_NOT_FOUND },
    });
  });

  it('rejects the default section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();

    await expect(
      catalogSectionService.addPack({
        id: defaultCatalogSectionId,
        packId: pack.id,
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_DEFAULT_PACKS_NOT_EDITABLE },
    });
    expect(catalogSectionRepository.addPack).not.toHaveBeenCalled();
  });
});

describe('CatalogSectionService.removePack', () => {
  const pack: Pack = buildPack();

  it('returns the section without the removed pack', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.removePack.mockResolvedValue(events);

    const section: CatalogSection = await catalogSectionService.removePack({
      id: events.id,
      packId: pack.id,
    });

    expect(section).toEqual(events);
  });

  it('rejects an unknown section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.removePack.mockResolvedValue(null);

    await expect(
      catalogSectionService.removePack({ id: events.id, packId: pack.id }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_NOT_FOUND },
    });
  });

  it('rejects the default section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();

    await expect(
      catalogSectionService.removePack({
        id: defaultCatalogSectionId,
        packId: pack.id,
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_DEFAULT_PACKS_NOT_EDITABLE },
    });
    expect(catalogSectionRepository.removePack).not.toHaveBeenCalled();
  });
});

describe('CatalogSectionService.movePack', () => {
  const monuments: Pack = buildPack({
    id: '00000000-0000-4000-8000-000000000070',
  });
  const capitals: Pack = buildPack({
    id: '00000000-0000-4000-8000-000000000071',
  });
  const rivers: Pack = buildPack({
    id: '00000000-0000-4000-8000-000000000072',
  });
  const filledEvents: CatalogSection = {
    ...events,
    packIds: [monuments.id, capitals.id, rivers.id],
  };

  it('swaps a pack with the next one', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.lockPacks.mockResolvedValue(filledEvents);

    const section: CatalogSection = await catalogSectionService.movePack({
      id: events.id,
      packId: monuments.id,
      direction: CatalogSectionMoveDirection.DOWN,
    });

    expect(section).toEqual({
      ...events,
      packIds: [capitals.id, monuments.id, rivers.id],
    });
    expect(catalogSectionRepository.reorderPacks).toHaveBeenCalledWith({
      id: events.id,
      packIds: [capitals.id, monuments.id, rivers.id],
    });
  });

  it('keeps the order when the pack is already at the edge', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.lockPacks.mockResolvedValue(filledEvents);

    const section: CatalogSection = await catalogSectionService.movePack({
      id: events.id,
      packId: monuments.id,
      direction: CatalogSectionMoveDirection.UP,
    });

    expect(section).toEqual(filledEvents);
    expect(catalogSectionRepository.reorderPacks).not.toHaveBeenCalled();
  });

  it('rejects a pack outside the section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.lockPacks.mockResolvedValue(events);

    await expect(
      catalogSectionService.movePack({
        id: events.id,
        packId: monuments.id,
        direction: CatalogSectionMoveDirection.DOWN,
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_PACK_NOT_FOUND },
    });
    expect(catalogSectionRepository.reorderPacks).not.toHaveBeenCalled();
  });

  it('rejects an unknown section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();
    catalogSectionRepository.lockPacks.mockResolvedValue(null);

    await expect(
      catalogSectionService.movePack({
        id: events.id,
        packId: monuments.id,
        direction: CatalogSectionMoveDirection.DOWN,
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_NOT_FOUND },
    });
  });

  it('rejects the default section', async () => {
    const {
      catalogSectionRepository,
      catalogSectionService,
    }: ReturnType<typeof buildCatalogSectionService> =
      buildCatalogSectionService();

    await expect(
      catalogSectionService.movePack({
        id: defaultCatalogSectionId,
        packId: monuments.id,
        direction: CatalogSectionMoveDirection.DOWN,
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATALOG_SECTION_DEFAULT_PACKS_NOT_EDITABLE },
    });
    expect(catalogSectionRepository.lockPacks).not.toHaveBeenCalled();
  });
});
