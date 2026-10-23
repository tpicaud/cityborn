import { type Pack, type PackId, type PackTree } from '@cityborn/api';
import { Injectable } from '@nestjs/common';
import { PackService } from './pack.service';

@Injectable()
export class PublicPackService {
  constructor(private readonly packService: PackService) {}

  async findAll(): Promise<Pack[]> {
    const packs = await this.packService.findBy({ isPublished: true });
    return packs;
  }

  async findBy(filter: { ids?: PackId[] }): Promise<Pack[]> {
    const packs = await this.packService.findBy({
      ...filter,
      isPublished: true,
    });
    return packs;
  }

  async getTrees(): Promise<PackTree[]> {
    const roots = await this.packService.findTree({ isPublished: true });
    return roots;
  }
}
