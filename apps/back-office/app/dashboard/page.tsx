import { redirect } from 'next/navigation';
import { CategoriesEditor } from '@/components/categories-editor/categories-editor';
import { getSession } from '@/lib/auth';
import { getCategories } from '@/server/queries/category';

export default async function Dashboard() {
  const session = await getSession();

  if (!session?.isAuthenticated) {
    redirect('/login');
  }

  const categories = await getCategories();

  return <CategoriesEditor initialCategories={categories} />;
}
