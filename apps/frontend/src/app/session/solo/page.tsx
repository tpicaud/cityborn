import SoloSessionComponent from '@/components/Session/SoloSessionComponent';
import { getCategoryTrees } from '@/server/server-only/category';

export default async function SoloSessionPage() {
  const categoryTrees = await getCategoryTrees();
  return <SoloSessionComponent categoryTrees={categoryTrees} />;
}
