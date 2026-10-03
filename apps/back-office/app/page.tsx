'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loader from '@/components/ui/Loader';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="h-full flex items-center justify-center">
      <Loader />
    </div>
  );
}
