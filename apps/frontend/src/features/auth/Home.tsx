'use client';

import {
  type CurrentUser,
  useCurrentUser,
  useVerificationEmailResend,
  type VerificationEmailResend,
} from '@cityborn/client/auth';
import { PrimaryButton } from '@cityborn/design-system';
import { Typography } from '@mui/material';
import Image from 'next/image';
import Button from '@/components/ui/buttons/Button';
import LoadingButton from '@/components/ui/buttons/LoadingButton';

export default function Home({
  openSignIn,
  openSignUp,
}: {
  openSignIn: () => void;
  openSignUp: () => void;
}) {
  const { user }: CurrentUser = useCurrentUser();
  const verificationEmailResend: VerificationEmailResend =
    useVerificationEmailResend();

  return (
    <>
      <div className="relative flex flex-col gap-1 items-center w-full">
        <Image
          src="/logo.png"
          alt="Logo"
          width={200}
          height={200}
          style={{ objectFit: 'contain' }}
          className="object-contain w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-2xl"
          priority
        />
        <p className="text-base md:text-lg text-center ">
          Trouve le lieu de naissance des personnalités
        </p>
      </div>

      {user ? (
        <div className="flex flex-col items-center justify-center gap-2 w-full">
          <Typography variant="h5" className="text-center">
            Bienvenue <b>{user.username}</b> !
          </Typography>
          {user.isVerified === false && (
            <div className="flex flex-col items-center gap-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-center w-full max-w-xs">
              <p className="text-sm font-medium text-amber-900">
                Votre adresse e-mail n'est pas vérifiée
              </p>
              <LoadingButton
                variant="text"
                color="warning"
                size="small"
                className="normal-case underline"
                onClick={verificationEmailResend.resend}
                disabled={verificationEmailResend.isSent}
              >
                {verificationEmailResend.isSent
                  ? 'E-mail de vérification envoyé'
                  : 'Renvoyer un e-mail de vérification'}
              </LoadingButton>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center justify-center w-full">
          <PrimaryButton label="Connexion" onPress={openSignIn} />
          <Button
            variant="contained"
            color="primary"
            className="text-white px-6 w-full rounded"
            onClick={openSignUp}
          >
            <p className="px-3">Inscription</p>
          </Button>
        </div>
      )}
    </>
  );
}
