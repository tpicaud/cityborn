import type {
  CreateWorldLocation,
  WorldLocation,
  WorldLocationSource,
} from '@cityborn/api';

export const WORLD_LOCATION_REPOSITORY = Symbol('WORLD_LOCATION_REPOSITORY');

export interface WorldLocationRepository {
  existsById(id: string): Promise<boolean>;
  findById(
    id: string,
    includes: { geometry: boolean },
  ): Promise<WorldLocation | null>;
  findBySource(
    source: WorldLocationSource,
    includes: { geometry: boolean },
  ): Promise<WorldLocation | null>;
  create(data: CreateWorldLocation): Promise<WorldLocation>;
  delete(id: string): Promise<void>;
}
