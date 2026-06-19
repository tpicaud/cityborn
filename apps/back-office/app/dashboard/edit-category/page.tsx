import { CategoryBuilder } from '@/components/category-builder/category-builder';
import { getCategory } from '@/server/queries/category';

export default async function EditCategory({
  searchParams,
}: {
  searchParams: Promise<{ id: string }>;
}) {
  const { id } = await searchParams;
  const category = await getCategory(id);
  return <CategoryBuilder fetchedCategory={category} />;
}
