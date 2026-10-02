import { type CategoryApi, createCategoryApi } from '@cityborn/client/category';
import { contractClient } from './contractClient';

export const categoryApi: CategoryApi = createCategoryApi(contractClient);
