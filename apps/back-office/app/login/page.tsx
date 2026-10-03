'use client';

import { useAuth } from '@cityborn/client/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SignInForm } from '@/components/auth/sign-in-form';

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-md p-8 mb-40 bg-zinc-800/95 backdrop-blur-sm rounded-lg border border-zinc-700 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-zinc-50">
          Cityborn Admin Dashboard
        </h1>
        <SignInForm />
      </div>
    </div>
  );
}
