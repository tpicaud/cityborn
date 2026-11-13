'use client';

import { type SignInFlow, useSignInFlow } from '@cityborn/client/auth';
import { Box, FormControl, TextField, Typography } from '@mui/material';
import Button from '@/components/ui/buttons/Button';
import { SignInWithGoogleButton } from './google-sign-in/GoogleSignIn';
import { RequestPasswordResetDialog } from './RequestPasswordResetDialog';

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
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300 }}
    >
      <Box
        component="form"
        onSubmit={submit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
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
      </Box>

      <RequestPasswordResetDialog />

      <div className="flex flex-row gap-3 items-center w-full">
        <div className="flex-1 h-px bg-black rounded-full"></div>
        <Typography>OU</Typography>
        <div className="flex-1 h-px bg-black rounded-full"></div>
      </div>

      <SignInWithGoogleButton />
    </Box>
  );
};
