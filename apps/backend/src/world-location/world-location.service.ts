import type {
  CreateWorldLocation,
  WorldLocation,
  WorldLocationPreview,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  WORLD_LOCATION_REPOSITORY,
  type WorldLocationRepository,
} from './repositories/world-location.repository';

@Injectable()
export class WorldLocationService {
  constructor(
    @Inject(WORLD_LOCATION_REPOSITORY)
    private readonly worldLocationRepository: WorldLocationRepository,
  ) {}

  async getById(id: string): Promise<WorldLocation | null> {
    return this.worldLocationRepository.findById(id, { geometry: true });
  }

  async getPreviewById(id: string): Promise<WorldLocationPreview | null> {
    const worldLocation = await this.worldLocationRepository.findById(id, {
      geometry: false,
    });
    if (!worldLocation) return null;

    return {
      id: worldLocation.id,
      name: worldLocation.name,
      display_name: worldLocation.display_name,
    };
  }

  @Transactional()
  async findOrCreate(
    createWorldLocation: CreateWorldLocation,
  ): Promise<WorldLocation> {
    const existing = await this.worldLocationRepository.findBySource(
      {
        provider: createWorldLocation.osm_type,
        external_id: createWorldLocation.source.external_id,
      },
      { geometry: true },
    );
    if (existing) return existing;

    return this.worldLocationRepository.create(createWorldLocation);
  }

  async delete(id: string): Promise<void> {
    await this.worldLocationRepository.delete(id);
  }
}
