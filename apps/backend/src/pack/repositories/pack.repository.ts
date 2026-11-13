import type {
  CreatePack,
  FullPack,
  GuessObjectId,
  Pack,
  PackId,
  ThemeId,
  UpdatePack,
} from '@cityborn/api';

export const PACK_REPOSITORY = Symbol('PACK_REPOSITORY');

export type PackFilter = {
  ids?: PackId[];
  isPublished?: boolean;
};

export interface PackRepository {
  findBy(filter: PackFilter): Promise<Pack[]>;
  findFullBy(filter: PackFilter): Promise<FullPack[]>;
  create(data: CreatePack): Promise<Pack>;
  lock(id: PackId): Promise<void>;
  removeFromThemeSections(data: {
    packId: PackId;
    themeId: ThemeId;
  }): Promise<void>;
  update(packId: PackId, data: UpdatePack): Promise<Pack>;
  countByGuessObjectId(id: GuessObjectId): Promise<number>;
  delete(id: PackId): Promise<void>;
}
