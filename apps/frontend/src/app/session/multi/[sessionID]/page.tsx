import MultiSessionComponent from '@/components/Session/MultiSessionComponent';
import { getCategories } from '@/server/queries/category';

export default async function MultiSessionPage() {
  const categories = await getCategories();
  return <MultiSessionComponent categories={categories} />;
}
