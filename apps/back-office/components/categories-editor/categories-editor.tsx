'use client';

import type { Category, CreateCategory } from '@cityborn/api';
import { useError } from '@cityborn/client';
import { RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { createCategory } from '@/server/actions/category';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';
import { CategoriesList } from './categories-list';
import { CreateCategoryDialog } from './create-category-popup';

export function CategoriesEditor({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const router = useRouter();
  const { invokeError } = useError();

  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchValue, setSearchValue] = useState<string>('');

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [categories, searchValue]);

  function handleFetchCategories() {
    startTransition(() => router.refresh());
  }

  async function handleCreateCategory(
    newCategory: CreateCategory,
  ): Promise<boolean> {
    try {
      setIsLoading(true);
      const result = await createCategory(newCategory);
      if (!result.ok) {
        invokeError(result.error);
        return false;
      }
      const category = result.data;
      categories.push(category);
      await onCategorySelect(category);
      return true;
    } catch (error) {
      invokeError(error instanceof Error ? error.message : 'Erreur inattendue');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function onCategorySelect(category: Category) {
    router.push(`/dashboard/edit-category?id=${category.id}`);
  }

  return (
    <div className="h-full w-full flex flex-col gap-6">
      <div className="flex flex-col w-full">
        <div className="flex flex-row gap-2 mb-2 items-center">
          <h2 className="text-xl font-bold">Catégories</h2>
        </div>

        <span className="h-[2px] w-full bg-foreground"></span>
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <h2 className="text-xl font-bold">Rechercher</h2>
        <input
          placeholder="e.g. Sport"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-[60%] pl-2 h-10 rounded-xl border border-gray-300"
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex flex-row gap-2 mb-1">
          <CreateCategoryDialog handleCreateCategory={handleCreateCategory} />
          <Button variant="outline" onClick={handleFetchCategories}>
            <RefreshCcw />
          </Button>
        </div>
        {!isLoading && !isPending ? (
          !filteredCategories || filteredCategories.length === 0 ? (
            <p className="text-center text-gray-300">
              Aucunes catégories trouvées
            </p>
          ) : (
            <CategoriesList
              categories={filteredCategories}
              onCategorySelect={onCategorySelect}
            />
          )
        ) : (
          <div className="flex items-center justify-center">
            <Loader />
          </div>
        )}
      </div>
    </div>
  );
}
