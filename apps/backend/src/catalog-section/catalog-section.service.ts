import {
  type CatalogSection,
  type CatalogSectionId,
  type CatalogSectionMoveDirection,
  type CreateCatalogSection,
  ErrorCode,
  type Pack,
  type PackId,
  type SaveCatalogSection,
} from '@cityborn/api';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  OrderedNamedList,
  swapWithNeighbour,
} from '../ordered-list/ordered-named-list';
import { PackService } from '../pack/pack.service';
import { ThemeService } from '../theme/theme.service';
import { defaultCatalogSectionId } from './default-catalog-section';
import {
  CATALOG_SECTION_REPOSITORY,
  type CatalogSectionRepository,
} from './repositories/catalog-section.repository';

@Injectable()
export class CatalogSectionService {
  private readonly orderedSections: OrderedNamedList<CatalogSection>;

  constructor(
    @Inject(CATALOG_SECTION_REPOSITORY)
    private readonly catalogSectionRepository: CatalogSectionRepository,
    private readonly packService: PackService,
    private readonly themeService: ThemeService,
  ) {
    this.orderedSections = new OrderedNamedList({
      repository: catalogSectionRepository,
      notFound: () => this.sectionNotFound(),
      nameConflict: {
        code: ErrorCode.CATALOG_SECTION_NAME_ALREADY_EXISTS,
        message: 'Catalog section name already exists',
      },
      belongsToSameList: (section, movedSection) =>
        section.themeId === movedSection.themeId,
    });
  }

  async findAll(): Promise<CatalogSection[]> {
    return this.catalogSectionRepository.findAll();
  }

  async findPlayable(): Promise<CatalogSection[]> {
    return this.catalogSectionRepository.findPlayable();
  }

  @Transactional()
  async create(section: CreateCatalogSection): Promise<CatalogSection> {
    if (section.themeId !== null)
      await this.themeService.findById(section.themeId);
    return this.orderedSections.append(() =>
      this.catalogSectionRepository.create(section),
    );
  }

  async rename({
    id,
    section,
  }: {
    id: CatalogSectionId;
    section: SaveCatalogSection;
  }): Promise<CatalogSection> {
    const renamedSection: CatalogSection | null =
      await this.orderedSections.save(() =>
        this.catalogSectionRepository.rename({ id, name: section.name }),
      );
    if (!renamedSection) throw this.sectionNotFound();
    return renamedSection;
  }

  @Transactional()
  async move({
    id,
    direction,
  }: {
    id: CatalogSectionId;
    direction: CatalogSectionMoveDirection;
  }): Promise<CatalogSection[]> {
    return this.orderedSections.move({ id, direction });
  }

  async delete(id: CatalogSectionId): Promise<void> {
    if (id === defaultCatalogSectionId)
      throw new BadRequestException({
        code: ErrorCode.CATALOG_SECTION_DEFAULT_NOT_DELETABLE,
        message: 'Default catalog section cannot be deleted',
      });
    if (!(await this.catalogSectionRepository.delete(id)))
      throw this.sectionNotFound();
  }

  @Transactional()
  async addPack({
    id,
    packId,
  }: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection> {
    this.ensurePacksEditable(id);
    const section: CatalogSection | null =
      await this.catalogSectionRepository.lockPacks(id);
    if (!section) throw this.sectionNotFound();
    await this.catalogSectionRepository.lockPack(packId);
    const pack: Pack = await this.packService.findById(packId);
    if (section.themeId !== null && pack.themeId !== section.themeId)
      throw new BadRequestException({
        code: ErrorCode.CATALOG_SECTION_PACK_OUTSIDE_THEME,
        message: 'Pack does not belong to the catalog section theme',
      });
    const sectionWithPack: CatalogSection | null =
      await this.catalogSectionRepository.addPack({ id, packId });
    if (!sectionWithPack) throw this.sectionNotFound();
    return sectionWithPack;
  }

  async removePack({
    id,
    packId,
  }: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection> {
    this.ensurePacksEditable(id);
    const section: CatalogSection | null =
      await this.catalogSectionRepository.removePack({ id, packId });
    if (!section) throw this.sectionNotFound();
    return section;
  }

  @Transactional()
  async movePack({
    id,
    packId,
    direction,
  }: {
    id: CatalogSectionId;
    packId: PackId;
    direction: CatalogSectionMoveDirection;
  }): Promise<CatalogSection> {
    this.ensurePacksEditable(id);
    const section: CatalogSection | null =
      await this.catalogSectionRepository.lockPacks(id);
    if (!section) throw this.sectionNotFound();
    const index: number = section.packIds.indexOf(packId);
    if (index === -1)
      throw new NotFoundException({
        code: ErrorCode.CATALOG_SECTION_PACK_NOT_FOUND,
        message: 'Pack not found in catalog section',
      });
    const reorderedPackIds: PackId[] | null = swapWithNeighbour({
      items: section.packIds,
      index,
      direction,
    });
    if (!reorderedPackIds) return section;
    await this.catalogSectionRepository.reorderPacks({
      id,
      packIds: reorderedPackIds,
    });
    return { ...section, packIds: reorderedPackIds };
  }

  private ensurePacksEditable(id: CatalogSectionId): void {
    if (id === defaultCatalogSectionId)
      throw new BadRequestException({
        code: ErrorCode.CATALOG_SECTION_DEFAULT_PACKS_NOT_EDITABLE,
        message: 'Default catalog section packs cannot be edited',
      });
  }

  private sectionNotFound(): NotFoundException {
    return new NotFoundException({
      code: ErrorCode.CATALOG_SECTION_NOT_FOUND,
      message: 'Catalog section not found',
    });
  }
}
