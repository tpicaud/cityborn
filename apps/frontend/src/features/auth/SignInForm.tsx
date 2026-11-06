'use client';

import { type SignInFlow, useSignInFlow } from '@cityborn/client/auth';
import type { Navigation } from '@cityborn/client/platform';
import { Box, FormControl, TextField, Typography } from '@mui/material';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/buttons/Button';
import { useNavigation } from '@/lib/navigation';
import { SignInWithGoogleButton } from './GoogleSignIn';
import { RequestPasswordResetDialog } from './RequestPasswordResetDialog';

export const SignInForm = () => {
  const router: AppRouterInstance = useRouter();
  const navigation: Navigation = useNavigation();
  const {
    form: {
      register,
      formState: { errors, isSubmitting },
    },
    submit,
  }: SignInFlow = useSignInFlow({
    onSignedIn: () => navigation.returnTo('/'),
  });

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300 }}
    >
      <Typography variant="h5" align="center">
        Connexion
      </Typography>

      <FormControl>
        <TextField
          label="Username"
          {...register('identifier')}
          error={!!errors.identifier}
          helperText={errors.identifier?.message}
        />
      </FormControl>

      <FormControl>
        <TextField
          type="password"
          label="Password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
      </FormControl>

      <Button variant="contained" type="submit" loading={isSubmitting}>
        Se connecter
      </Button>

      <RequestPasswordResetDialog />

      <Button variant="text" onClick={() => router.push('/auth/sign-up')}>
        Pas de compte ? Inscris-toi ici !
      </Button>

      <div className="flex flex-row gap-3 items-center w-full">
        <div className="flex-1 h-px bg-black rounded-full"></div>
        <Typography>OU</Typography>
        <div className="flex-1 h-px bg-black rounded-full"></div>
      </div>

      <SignInWithGoogleButton />
    </Box>
  );
};
