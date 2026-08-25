'use client';

import { isApiError } from '@cityborn/api';
import { toAppError } from '@cityborn/client';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import Link from 'next/link';
import { useEffect } from 'react';
import Button from '@/components/ui/buttons/Button';

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

  const message = isApiError(error)
    ? toAppError(error).message
    : error.message || "Quelque chose s'est mal passé.";

  return (
    <div className="h-full min-h-screen w-full flex flex-col items-center justify-center gap-4 text-center px-4">
      <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
      <div>
        <p className="font-bold text-lg">Une erreur est survenue</p>
        <p>{message}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outlined" onClick={() => reset()}>
          Réessayer
        </Button>
        <Button variant="contained" LinkComponent={Link} href="/">
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}
