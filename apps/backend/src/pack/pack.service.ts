import {
  type CreatePack,
  ErrorCode,
  type FullPack,
  type GuessObjectId,
  type Pack,
  type PackId,
  type PackTree,
  type UpdatePack,
} from '@cityborn/api';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { GuessObjectService } from '../guess-object/guess-object.service';
import { ThemeService } from '../theme/theme.service';
import {
  PACK_REPOSITORY,
  type PackRepository,
} from './repositories/pack.repository';

@Injectable()
export class PackService {
  constructor(
    @Inject(PACK_REPOSITORY)
    private readonly packRepository: PackRepository,
    private readonly guessObjectService: GuessObjectService,
    private readonly themeService: ThemeService,
  ) {}

  async findTrees(): Promise<PackTree[]> {
    return this.packRepository.findTree({});
  }

  async findPublishedTrees(): Promise<PackTree[]> {
    return this.packRepository.findTree({ isPublished: true });
  }

  async findAll(): Promise<Pack[]> {
    return this.packRepository.findBy({});
  }

  async findPublished(): Promise<Pack[]> {
    return this.packRepository.findBy({ isPublished: true });
  }

  async findById(id: PackId): Promise<Pack> {
    return this.findOne({ id });
  }

  async findPublishedById(id: PackId): Promise<Pack> {
    return this.findOne({ id, isPublished: true });
  }

  async findFullById(id: PackId): Promise<FullPack> {
    const [pack]: FullPack[] = await this.packRepository.findFullBy({
      ids: [id],
    });
    if (!pack) {
      throw new NotFoundException({
        code: ErrorCode.PACK_NOT_FOUND,
        message: `Pack with id ${id} not found`,
      });
    }
    return pack;
  }

  async create(data: CreatePack): Promise<Pack> {
    return this.packRepository.create(data);
  }

  async update(packId: PackId, data: UpdatePack): Promise<Pack> {
    if (data.themeId !== undefined) {
      await this.themeService.findById(data.themeId);
    }
    if (!data.disconnectIds?.length) {
      return this.packRepository.update(packId, data);
    }
    return this.updateWithOrphanCleanup(packId, data, data.disconnectIds);
  }

  @Transactional()
  private async updateWithOrphanCleanup(
    packId: PackId,
    data: UpdatePack,
    disconnectIds: GuessObjectId[],
  ): Promise<Pack> {
    const updatedPack: Pack = await this.packRepository.update(packId, data);
    await this.deleteOrphanGuessObjects(disconnectIds);
    return updatedPack;
  }

  @Transactional()
  async delete(id: PackId): Promise<void> {
    const pack: FullPack = await this.findFullById(id);

    const childrenCount: number = await this.packRepository.countChildren(id);
    if (childrenCount > 0) {
      throw new BadRequestException({
        code: ErrorCode.PACK_HAS_CHILDREN,
        message: `Pack with id ${id} has children and cannot be deleted`,
      });
    }

    await this.packRepository.delete(id);
    await this.deleteOrphanGuessObjects(
      pack.guessObjects.map((guessObject) => guessObject.id),
    );
  }

  private async findOne({
    id,
    isPublished,
  }: {
    id: PackId;
    isPublished?: boolean;
  }): Promise<Pack> {
    const [pack]: Pack[] = await this.packRepository.findBy({
      ids: [id],
      isPublished,
    });
    if (!pack) {
      throw new NotFoundException({
        code: ErrorCode.PACK_NOT_FOUND,
        message: `Pack with id ${id} not found`,
      });
    }
    return pack;
  }

  private async deleteOrphanGuessObjects(
    guessObjectIds: GuessObjectId[],
  ): Promise<void> {
    const [guessObjectId, ...remainingGuessObjectIds] = guessObjectIds;
    if (guessObjectId === undefined) return;

    const count: number =
      await this.packRepository.countByGuessObjectId(guessObjectId);
    if (count === 0) await this.guessObjectService.delete(guessObjectId);
    await this.deleteOrphanGuessObjects(remainingGuessObjectIds);
  }
}
