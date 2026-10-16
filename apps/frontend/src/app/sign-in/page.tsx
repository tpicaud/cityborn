'use client';

import { type CurrentUser, useCurrentUser } from '@cityborn/client/auth';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
  const { user }: CurrentUser = useCurrentUser();
  if (user) redirect('/');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <SignInForm />
    </div>
  );
}
