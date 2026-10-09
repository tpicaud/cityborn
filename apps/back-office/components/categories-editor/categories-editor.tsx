'use client';

import type { Category } from '@cityborn/api';
import {
  type CategoryCatalog,
  useCategoryCatalog,
} from '@cityborn/client/admin';
import { RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';
import { CategoriesList } from './categories-list';
import { CreateCategoryDialog } from './create-category-popup';

export function CategoriesEditor() {
  const router = useRouter();
  const { categories, isLoading, reloadCategories }: CategoryCatalog =
    useCategoryCatalog();
  const [searchValue, setSearchValue] = useState<string>('');

  const filteredCategories = useMemo(() => {
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [categories, searchValue]);

  function onCategorySelect(category: Category): void {
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
          <CreateCategoryDialog onCategoryCreated={onCategorySelect} />
          <Button variant="outline" onClick={reloadCategories}>
            <RefreshCcw />
          </Button>
        </div>
        {!isLoading ? (
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
