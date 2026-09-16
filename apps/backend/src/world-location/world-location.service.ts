import {
  type CreateWorldLocation,
  type WorldLocation,
  type WorldLocationId,
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

  async get(id: WorldLocationId): Promise<{ id: WorldLocationId } | null> {
    const exists = await this.worldLocationRepository.existsById(id);
    if (!exists) return null;
    return { id };
  }

  async getWithGeometry(id: WorldLocationId): Promise<WorldLocation | null> {
    return this.worldLocationRepository.findById(id, { geometry: true });
  }

  async findByExternalIdentifier(
    osmType: string,
    externalId: string,
  ): Promise<WorldLocation | null> {
    return this.worldLocationRepository.findBySource(
      { provider: osmType, external_id: externalId },
      { geometry: true },
    );
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

  async delete(id: WorldLocationId): Promise<void> {
    await this.worldLocationRepository.delete(id);
  }
}
