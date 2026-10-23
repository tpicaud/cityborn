import {
  type CreatePack,
  ErrorCode,
  type FullPack,
  type Pack,
  type PackId,
  type PackTree,
  type UpdatePack,
} from '@cityborn/api';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PackService } from './pack.service';

@Injectable()
export class AdminPackService {
  constructor(private readonly packService: PackService) {}

  async findAll(): Promise<Pack[]> {
    const packs = await this.packService.findAll();
    return packs;
  }

  async findBy(filter: { ids?: PackId[] }): Promise<Pack[]> {
    const packs = await this.packService.findBy(filter);
    return packs;
  }

  async findFullBy(id: PackId): Promise<FullPack> {
    const [pack] = await this.packService.findFullBy({ ids: [id] });
    if (!pack) {
      throw new NotFoundException({
        code: ErrorCode.PACK_NOT_FOUND,
        message: `Pack with id ${id} not found`,
      });
    }
    return pack;
  }

  async create(data: CreatePack): Promise<Pack> {
    const pack = await this.packService.create(data);
    return pack;
  }

  async update(id: PackId, data: UpdatePack): Promise<Pack> {
    const updated_pack = await this.packService.update(id, data);
    return updated_pack;
  }

  async delete(id: PackId): Promise<void> {
    await this.packService.delete(id);
  }

  async getTrees(): Promise<PackTree[]> {
    const roots = await this.packService.findTree({});
    return roots;
  }
}
