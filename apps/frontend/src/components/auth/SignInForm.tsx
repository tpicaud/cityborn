'use client';

import { type SignInFlow, useSignInFlow } from '@cityborn/client/auth';
import { Box, FormControl, TextField, Typography } from '@mui/material';
import { RequestPasswordResetDialog } from '@/features/auth/RequestPasswordResetDialog';
import Button from '../ui/buttons/Button';
import { SignInWithGoogleButton } from './GoogleSignIn';

export const SignInForm = () => {
  const {
    form: {
      register,
      formState: { errors, isSubmitting },
    },
    submit,
  }: SignInFlow = useSignInFlow();

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        maxWidth: 300,
      }}
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

      <RequestPasswordResetDialog />

      <Button variant="contained" type="submit" loading={isSubmitting}>
        Se connecter
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
