import type { CategoryTree } from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

export interface CategoryApi {
  getCategoryTrees(): Promise<CategoryTree[]>;
}

export function createCategoryApi(
  contractClient: Pick<ContractClient, 'category'>,
): CategoryApi {
  return {
    async getCategoryTrees() {
      return unwrapApiResponse(
        await contractClient.category.getCategoryTrees({}),
      );
    },
  };
}
