import {
  type CatalogSection,
  type CatalogSectionId,
  CatalogSectionMoveDirection,
  CatalogSectionNameSchema,
  type CreateCatalogSection,
  ErrorCode,
  type PackId,
  type ThemeId,
} from '@cityborn/api';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import type { SafeParseReturnType } from 'zod';
import {
  CATALOG_SECTION_REPOSITORY,
  type CatalogSectionRepository,
} from './repositories/catalog-section.repository';

function moveItem<T>({
  items,
  index,
  direction,
}: {
  items: T[];
  index: number;
  direction: CatalogSectionMoveDirection;
}): T[] {
  const targetIndex: number =
    index + (direction === CatalogSectionMoveDirection.UP ? -1 : 1);
  const item: T | undefined = items[index];
  const target: T | undefined = items[targetIndex];
  return item === undefined || target === undefined
    ? items
    : items.map((value, position) =>
        position === index ? target : position === targetIndex ? item : value,
      );
}
@Injectable()
export class CatalogSectionService {
  constructor(
    @Inject(CATALOG_SECTION_REPOSITORY)
    private readonly repository: CatalogSectionRepository,
  ) {}
  async findAll(publishedOnly: boolean): Promise<CatalogSection[]> {
    return this.repository.findAll(publishedOnly);
  }
  @Transactional()
  async create(data: CreateCatalogSection): Promise<CatalogSection> {
    await this.repository.lock();
    if (
      data.themeId !== null &&
      !(await this.repository.themeExists(data.themeId))
    )
      throw new NotFoundException({ code: ErrorCode.THEME_NOT_FOUND });
    const name: string = await this.validateName({
      name: data.name,
      themeId: data.themeId,
    });
    return this.repository.create({ ...data, name });
  }
  @Transactional()
  async rename({
    id,
    name,
  }: {
    id: CatalogSectionId;
    name: string;
  }): Promise<CatalogSection> {
    await this.repository.lock();
    const section: CatalogSection = await this.findById(id);
    const validName: string = await this.validateName({
      name,
      themeId: section.themeId,
      id,
    });
    return this.repository.rename({ id, name: validName });
  }
  @Transactional()
  async move({
    id,
    direction,
  }: {
    id: CatalogSectionId;
    direction: CatalogSectionMoveDirection;
  }): Promise<CatalogSection[]> {
    await this.repository.lock();
    const section: CatalogSection = await this.findById(id);
    const sections: CatalogSection[] = (
      await this.repository.findAll(false)
    ).filter((item) => item.themeId === section.themeId);
    const reordered: CatalogSection[] = moveItem({
      items: sections,
      index: sections.findIndex((item) => item.id === id),
      direction,
    });
    await this.repository.reorder(reordered.map((item) => item.id));
    return this.repository.findAll(false);
  }
  @Transactional()
  async delete(id: CatalogSectionId): Promise<void> {
    await this.repository.lock();
    await this.findById(id);
    await this.repository.delete(id);
  }
  @Transactional()
  async addPack({
    id,
    packId,
  }: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection> {
    await this.repository.lock();
    const section: CatalogSection = await this.findById(id);
    const pack: { themeId: ThemeId } | null =
      await this.repository.findPackForAssignment(packId);
    if (!pack) throw new NotFoundException({ code: ErrorCode.PACK_NOT_FOUND });
    if (section.themeId !== null && section.themeId !== pack.themeId)
      throw new BadRequestException({
        code: ErrorCode.CATALOG_SECTION_PACK_THEME_MISMATCH,
      });
    if (!section.packIds.includes(packId))
      await this.repository.addPack({ id, packId });
    return this.findById(id);
  }
  @Transactional()
  async removePack({
    id,
    packId,
  }: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection> {
    await this.repository.lock();
    await this.findById(id);
    await this.repository.removePack({ id, packId });
    return this.findById(id);
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
    await this.repository.lock();
    const section: CatalogSection = await this.findById(id);
    const index: number = section.packIds.indexOf(packId);
    if (index === -1)
      throw new NotFoundException({ code: ErrorCode.PACK_NOT_FOUND });
    await this.repository.reorderPacks({
      id,
      packIds: moveItem({ items: section.packIds, index, direction }),
    });
    return this.findById(id);
  }
  private async findById(id: CatalogSectionId): Promise<CatalogSection> {
    const section: CatalogSection | null = await this.repository.findById(id);
    if (!section)
      throw new NotFoundException({
        code: ErrorCode.CATALOG_SECTION_NOT_FOUND,
      });
    return section;
  }
  private async validateName({
    name,
    themeId,
    id,
  }: {
    name: string;
    themeId: ThemeId | null;
    id?: CatalogSectionId;
  }): Promise<string> {
    const parsed: SafeParseReturnType<string, string> =
      CatalogSectionNameSchema.safeParse(name);
    if (!parsed.success)
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: parsed.error.issues[0]?.message,
      });
    const sections: CatalogSection[] = await this.repository.findAll(false);
    if (
      sections.some(
        (section) =>
          section.id !== id &&
          section.themeId === themeId &&
          section.name.toLowerCase() === parsed.data.toLowerCase(),
      )
    )
      throw new ConflictException({
        code: ErrorCode.CATALOG_SECTION_NAME_ALREADY_EXISTS,
      });
    return parsed.data;
  }
}
