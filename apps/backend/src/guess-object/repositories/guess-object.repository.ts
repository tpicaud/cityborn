import type {
  Category,
  CategoryId,
  CreateGuessObject,
  FullGuessObject,
  GuessObject,
  GuessObjectDraft,
  GuessObjectId,
  PatchGuessObject,
  WorldLocationId,
} from '@cityborn/api';

export const GUESS_OBJECT_REPOSITORY = Symbol('GUESS_OBJECT_REPOSITORY');

export interface GuessObjectFilter {
  ids?: GuessObjectId[];
  external_id?: string;
  categoryIds?: CategoryId[];
}

export interface GuessObjectDeletionDetails {
  id: GuessObjectId;
  world_location_id: WorldLocationId;
  categories: Pick<Category, 'id'>[];
}

export interface GuessObjectRepository {
  findBy(filter: GuessObjectFilter): Promise<GuessObject[]>;
  findFullBy(filter: GuessObjectFilter): Promise<FullGuessObject[]>;
  findByNameAndWorldLocation(
    name: string,
    world_location_id: WorldLocationId,
  ): Promise<Pick<GuessObject, 'id'> | null>;
  create(createGuessObject: CreateGuessObject): Promise<GuessObjectId>;
  update(
    id: GuessObjectId,
    updatedFields: PatchGuessObject,
  ): Promise<GuessObjectId>;
  findForDeletion(
    id: GuessObjectId,
  ): Promise<GuessObjectDeletionDetails | null>;
  delete(id: GuessObjectId): Promise<void>;
  countByWorldLocationId(world_location_id: WorldLocationId): Promise<number>;
  searchDraftByName(name: string): Promise<GuessObjectDraft[]>;
}
