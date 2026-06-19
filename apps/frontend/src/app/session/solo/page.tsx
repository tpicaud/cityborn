import SoloSessionComponent from '@/components/Session/SoloSessionComponent';
import { getCategories } from '@/server/queries/category';

export default async function SoloSessionPage() {
  const categories = await getCategories();
  return <SoloSessionComponent categories={categories} />;
}
