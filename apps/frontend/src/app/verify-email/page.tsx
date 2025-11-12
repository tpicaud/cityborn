'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/contexts/ApiContext';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const verification_token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const router = useRouter();
  const { refreshUser } = useAuth();
  const apiClient = useApi();

  useEffect(() => {
    const verifyEmail = async () => {
      if (verification_token) {
        try {
          await apiClient.verifyEmail(verification_token);
          setStatus('success');
        } catch {
          setStatus('error');
        }
      }
    };

    verifyEmail();
  }, [verification_token]);

  let content;
  switch (status) {
    case 'loading':
      content = <h2>Vérification en cours...</h2>;
      break;

    case 'success':
      content = <h2>Ton email a été vérifié avec succès 🎉</h2>;
      break;

    case 'error':
      content = (
        <h2>
          Lien invalide ou expiré. Demandez un nouveau lien depuis votre profil
        </h2>
      );
      break;
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen gap-2">
      {content}
      <Button
        variant="contained"
        color="primary"
        className="bg-green-500 hover:bg-green-600 text-white px-6 w-[10%] rounded "
        onClick={async () => {
          await refreshUser();
          router.push('/');
        }}
      >
        <p className="px-3">Menu</p>
      </Button>
    </div>
  );
}
