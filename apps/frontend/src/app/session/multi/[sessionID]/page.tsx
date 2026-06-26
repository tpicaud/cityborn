import MultiSessionComponent from '@/components/Session/MultiSessionComponent';
import { getCategoryTrees } from '@/server/queries/category';

export default async function MultiSessionPage() {
  const categoryTrees = await getCategoryTrees();
  return <MultiSessionComponent categoryTrees={categoryTrees} />;
}
