'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, CircularProgress, Typography } from '@mui/material';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { useAuth } from '@/contexts/AuthContext';
import Button from '../ui/buttons/Button';

type VerifyEmailComponentProps = {
  verificationToken: string;
};

type VerificationStatus = 'loading' | 'success' | 'error';

export function VerifyEmailComponent({
  verificationToken,
}: VerifyEmailComponentProps) {
  const apiClient = useApi();
  const { refreshUser } = useAuth();
  const hasVerified = useRef(false);
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState(
    'Validation de votre adresse mail en cours...',
  );

  useEffect(() => {
    const verifyEmail = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;

      if (!verificationToken) {
        setStatus('error');
        setMessage('Le lien de vérification est invalide ou incomplet.');
        return;
      }

      try {
        await apiClient.verifyEmail(verificationToken);
        await refreshUser();
        setStatus('success');
        setMessage('Votre adresse mail est maintenant vérifiée.');
      } catch {
        setStatus('error');
        setMessage(
          'Le lien de vérification est invalide, expiré, ou a déjà été utilisé.',
        );
      }
    };

    verifyEmail();
  }, [apiClient, refreshUser, verificationToken]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Box className="flex flex-col items-center gap-4 bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-w-sm w-full text-center">
        {status === 'loading' && <CircularProgress size={32} />}
        {status === 'success' && (
          <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
        )}
        {status === 'error' && (
          <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
        )}

        <Typography variant="h5">
          {status === 'success'
            ? 'Email vérifié'
            : status === 'error'
              ? 'Vérification impossible'
              : 'Vérification'}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>

        {status !== 'loading' && (
          <Button variant="contained" LinkComponent={Link} href="/">
            Retour à l'accueil
          </Button>
        )}
      </Box>
    </main>
  );
}
