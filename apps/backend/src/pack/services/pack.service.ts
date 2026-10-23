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
import { GuessObjectService } from '../../guess-object/guess-object.service';
import {
  PACK_REPOSITORY,
  type PackFilter,
  type PackRepository,
} from '../repositories/pack.repository';

@Injectable()
export class PackService {
  constructor(
    @Inject(PACK_REPOSITORY)
    private readonly packRepository: PackRepository,
    private readonly guessObjectService: GuessObjectService,
  ) {}

  async findTree(filter: Pick<PackFilter, 'isPublished'>): Promise<PackTree[]> {
    return this.packRepository.findTree(filter);
  }

  async findAll(): Promise<Pack[]> {
    return this.packRepository.findBy({});
  }

  async findBy(filter: PackFilter): Promise<Pack[]> {
    return this.packRepository.findBy(filter);
  }

  async findFullBy(filter: PackFilter): Promise<FullPack[]> {
    return this.packRepository.findFullBy(filter);
  }

  async create(data: CreatePack): Promise<Pack> {
    return this.packRepository.create(data);
  }

  async update(packId: PackId, data: UpdatePack): Promise<Pack> {
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
    const updated_pack = await this.packRepository.update(packId, data);
    await this.deleteOrphanGuessObjects(disconnectIds);
    return updated_pack;
  }

  @Transactional()
  async delete(id: PackId): Promise<void> {
    const [pack] = await this.findFullBy({ ids: [id] });

    if (!pack) {
      throw new NotFoundException({
        code: ErrorCode.PACK_NOT_FOUND,
        message: `Pack with id ${id} not found`,
      });
    }

    const childrenCount = await this.packRepository.countChildren(id);
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
