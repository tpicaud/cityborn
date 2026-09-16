import type {
  CreateWorldLocation,
  WorldLocation,
  WorldLocationId,
  WorldLocationSource,
} from '@cityborn/api';

export const WORLD_LOCATION_REPOSITORY = Symbol('WORLD_LOCATION_REPOSITORY');

export interface WorldLocationRepository {
  existsById(id: WorldLocationId): Promise<boolean>;
  findById(
    id: WorldLocationId,
    includes: { geometry: boolean },
  ): Promise<WorldLocation | null>;
  findBySource(
    source: WorldLocationSource,
    includes: { geometry: boolean },
  ): Promise<WorldLocation | null>;
  create(data: CreateWorldLocation): Promise<WorldLocation>;
  delete(id: WorldLocationId): Promise<void>;
}
