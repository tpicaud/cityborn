import SoloSessionComponent from '@/components/Session/SoloSessionComponent';
import { getCategoryTrees } from '@/server/queries/category';

export default async function SoloSessionPage() {
  const categoryTrees = await getCategoryTrees();
  return <SoloSessionComponent categoryTrees={categoryTrees} />;
}
