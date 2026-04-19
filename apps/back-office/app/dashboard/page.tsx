// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { CategoriesEditor } from '@/components/categories-editor/categories-editor';
import { getSession } from '@/lib/auth';

export default async function Dashboard() {
  const session = await getSession();

  if (!session?.isAuthenticated) {
    redirect('/login');
  }

  return <CategoriesEditor />;
}
