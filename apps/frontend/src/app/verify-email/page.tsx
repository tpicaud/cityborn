import { Suspense } from 'react';
import { VerifyEmail } from '@/features/auth/VerifyEmail';

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="flex flex-col items-center gap-4 bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-w-sm w-full text-center">
        <Suspense>
          <VerifyEmail />
        </Suspense>
      </div>
    </main>
  );
}
