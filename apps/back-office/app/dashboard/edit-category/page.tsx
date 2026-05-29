import { CategoryBuilder } from '@/components/category-builder/category-builder';
import { getCategory } from '@/server/queries/category';

export default async function EditCategory({
  searchParams,
}: {
  searchParams: Promise<{ id: string }>;
}) {
  const { id } = await searchParams;
  const result = await getCategory(id);
  if (!result.ok) throw new Error(result.error.message);
  return <CategoryBuilder fetchedCategory={result.data} />;
}
