import type {
  CreatePack,
  FullPack,
  GuessObjectId,
  Pack,
  PackId,
  PackTree,
  UpdatePack,
} from '@cityborn/api';

export const PACK_REPOSITORY = Symbol('PACK_REPOSITORY');

export type PackFilter = {
  ids?: PackId[];
  isPublished?: boolean;
};

export interface PackRepository {
  findTree(filter: Pick<PackFilter, 'isPublished'>): Promise<PackTree[]>;
  findBy(filter: PackFilter): Promise<Pack[]>;
  findFullBy(filter: PackFilter): Promise<FullPack[]>;
  create(data: CreatePack): Promise<Pack>;
  update(packId: PackId, data: UpdatePack): Promise<Pack>;
  countChildren(id: PackId): Promise<number>;
  countByGuessObjectId(id: GuessObjectId): Promise<number>;
  delete(id: PackId): Promise<void>;
}
