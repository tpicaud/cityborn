'use client';

import { CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4 text-center">
      <CircleAlert strokeWidth={2.75} size={40} className="text-red-700" />
      <div>
        <p className="font-bold text-lg">Une erreur est survenue</p>
        <p>{error.message || "Quelque chose s'est mal passé."}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => reset()}>
          Réessayer
        </Button>
        <Button variant="primary" render={<Link href="/dashboard" />}>
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
}
