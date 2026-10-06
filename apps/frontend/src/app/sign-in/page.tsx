import type { User } from '@cityborn/api';
import { redirect } from 'next/navigation';
import { SignInComponent } from '@/components/auth/SignInComponent';
import { getCurrentUser } from '@/server/server-only/auth';

export default async function SignInPage() {
  const user: User | null = await getCurrentUser();
  if (user) redirect('/');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <SignInComponent />
    </div>
  );
}
