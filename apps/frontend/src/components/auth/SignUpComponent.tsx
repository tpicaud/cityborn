'use client';

import { type SignUpFlow, useSignUp } from '@cityborn/client/auth';
import { Box, Button, FormControl, TextField, Typography } from '@mui/material';
import { authApi } from '@/lib/api/auth';
import { SignInWithGoogleButton } from './GoogleSignIn';

export const SignUpComponent = () => {
  const {
    form: {
      register,
      formState: { errors, isSubmitting },
    },
    submit,
  }: SignUpFlow = useSignUp({ authApi });

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300 }}
    >
      <Typography variant="h5" align="center">
        Inscription
      </Typography>

      <FormControl>
        <TextField
          label="Username"
          {...register('username')}
          error={!!errors.username}
          helperText={errors.username?.message}
        />
      </FormControl>

      <FormControl>
        <TextField
          type="email"
          label="Email"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
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

      <FormControl>
        <TextField
          type="password"
          label="Confirm Password"
          {...register('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
        />
      </FormControl>

      <Button variant="contained" type="submit" loading={isSubmitting}>
        S'inscrire
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
