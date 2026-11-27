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
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { swapWithNeighbour } from '../ordered-list';
import { PackService } from '../pack/pack.service';
import { ThemeService } from '../theme/theme.service';
import { defaultCatalogSectionId } from './default-catalog-section';
import {
  CATALOG_SECTION_REPOSITORY,
  CatalogSectionNameAlreadyExistsError,
  type CatalogSectionRepository,
} from './repositories/catalog-section.repository';

@Injectable()
export class CatalogSectionService {
  constructor(
    @Inject(CATALOG_SECTION_REPOSITORY)
    private readonly catalogSectionRepository: CatalogSectionRepository,
    private readonly packService: PackService,
    private readonly themeService: ThemeService,
  ) {}

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
    await this.catalogSectionRepository.lockOrder();
    return this.save(() => this.catalogSectionRepository.create(section));
  }

  async rename({
    id,
    section,
  }: {
    id: CatalogSectionId;
    section: SaveCatalogSection;
  }): Promise<CatalogSection> {
    const renamedSection: CatalogSection | null = await this.save(() =>
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
    await this.catalogSectionRepository.lockOrder();
    const sections: CatalogSection[] =
      await this.catalogSectionRepository.findAll();
    const movedSection: CatalogSection | undefined = sections.find(
      (section) => section.id === id,
    );
    if (!movedSection) throw this.sectionNotFound();
    const filterSections: CatalogSection[] = sections.filter(
      (section) => section.themeId === movedSection.themeId,
    );
    const reorderedFilterSections: CatalogSection[] | null = swapWithNeighbour({
      items: filterSections,
      index: filterSections.indexOf(movedSection),
      direction,
    });
    if (!reorderedFilterSections) return sections;
    await this.catalogSectionRepository.reorder(
      reorderedFilterSections.map((section) => section.id),
    );
    return this.catalogSectionRepository.findAll();
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

  private async save<Section extends CatalogSection | null>(
    write: () => Promise<Section>,
  ): Promise<Section> {
    try {
      return await write();
    } catch (error: unknown) {
      if (error instanceof CatalogSectionNameAlreadyExistsError)
        throw new ConflictException({
          code: ErrorCode.CATALOG_SECTION_NAME_ALREADY_EXISTS,
          message: 'Catalog section name already exists',
        });
      throw error;
    }
  }
}
