'use client';

import {
  type EmailVerification,
  type EmailVerificationStatus,
  useEmailVerification,
} from '@cityborn/client/auth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { Box, CircularProgress, Typography } from '@mui/material';
import Link from 'next/link';
import { type ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import Button from '@/components/ui/buttons/Button';
import LoadingButton from '@/components/ui/buttons/LoadingButton';

type VerificationStatusContent = {
  icon: ReactNode;
  title: string;
  message: string;
};

const verificationStatusContents: Record<
  EmailVerificationStatus,
  VerificationStatusContent
> = {
  verifying: {
    icon: <CircularProgress size={32} />,
    title: 'Vérification',
    message: 'Validation de ton adresse e-mail en cours...',
  },
  verified: {
    icon: <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />,
    title: 'E-mail vérifié',
    message: 'Ton adresse e-mail est maintenant vérifiée.',
  },
  expired: {
    icon: <ErrorOutlineIcon color="warning" sx={{ fontSize: 40 }} />,
    title: 'Lien expiré',
    message:
      'Ce lien de vérification a expiré. Demande un nouveau lien pour vérifier ton adresse e-mail.',
  },
  invalid: {
    icon: <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />,
    title: 'Vérification impossible',
    message: 'Le lien de vérification est invalide ou a déjà été utilisé.',
  },
  renewed: {
    icon: <MarkEmailReadIcon color="primary" sx={{ fontSize: 40 }} />,
    title: 'Vérifie tes e-mails',
    message: 'Un nouveau lien de vérification vient de t’être envoyé.',
  },
};

export function VerifyEmail() {
  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const verificationToken: string =
    searchParams.get('verification_token') ?? searchParams.get('token') ?? '';
  const { status, renew }: EmailVerification = useEmailVerification({
    verificationToken,
  });
  const { icon, title, message }: VerificationStatusContent =
    verificationStatusContents[status];

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Box className="flex flex-col items-center gap-4 bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-w-sm w-full text-center">
        {icon}
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>

        {status === 'expired' && (
          <LoadingButton variant="contained" onClick={renew}>
            Renvoyer un lien
          </LoadingButton>
        )}

        {status !== 'verifying' && (
          <Button
            variant={status === 'expired' ? 'text' : 'contained'}
            LinkComponent={Link}
            href="/"
          >
            Retour à l'accueil
          </Button>
        )}
      </Box>
    </main>
  );
}
