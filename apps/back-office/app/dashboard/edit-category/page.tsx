import { CategoryBuilder } from '@/components/category-builder/category-builder';
import { getCategory } from './action';

export default async function EditCategory({
  searchParams,
}: {
  searchParams: { id: string };
}) {
  const { id } = await searchParams;
  const category = await getCategory(id);
  return <CategoryBuilder fetchedCategory={category} />;
}
