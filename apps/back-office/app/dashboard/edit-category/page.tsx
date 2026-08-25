import { notFound } from 'next/navigation';
import { CategoryBuilder } from '@/components/category-builder/category-builder';
import { getCategories, getFullCategory } from '@/server/server-only/category';

export default async function EditCategory({
  searchParams,
}: {
  searchParams: Promise<{ id: string }>;
}) {
  const { id } = await searchParams;
  const [category, categories] = await Promise.all([
    getFullCategory(id),
    getCategories(),
  ]);

  if (!category) notFound();

  return <CategoryBuilder fetchedCategory={category} categories={categories} />;
}
