import type { ApiResult, CategoryTree } from '@cityborn/api';
import { toApiResult } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

export interface CategoryApi {
  getCategoryTrees(): Promise<ApiResult<CategoryTree[]>>;
}

export function createCategoryApi(
  contractClient: Pick<ContractClient, 'category'>,
): CategoryApi {
  return {
    async getCategoryTrees() {
      return toApiResult(await contractClient.category.getCategoryTrees({}));
    },
  };
}
