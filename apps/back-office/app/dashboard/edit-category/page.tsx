import { CategoryBuilder } from '@/components/category-builder/category-builder';
import { getFullCategory } from '@/server/queries/category';

export default async function EditCategory({
  searchParams,
}: {
  searchParams: Promise<{ id: string }>;
}) {
  const { id } = await searchParams;
  const category = await getFullCategory(id);
  return <CategoryBuilder fetchedCategory={category} />;
}
