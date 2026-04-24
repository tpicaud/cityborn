import type { GuessObject } from './GuessObject.js';

export interface Category {
  id: string;
  name: string;
  isPublished: boolean;
  description?: string;
  guessObjectsIds?: string[];
  guessObjects?: GuessObject[];
}

export type CreateCategory = Omit<Category, 'id'>;

export type UpdateCategory = Category & {
  connectIds?: string[];
  disconnectIds?: string[];
};
