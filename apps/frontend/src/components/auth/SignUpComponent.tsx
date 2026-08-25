'use client';

import { CreateUserSchema } from '@cityborn/api';
import { useError } from '@cityborn/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, FormControl, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { signInWithGoogle, signUp } from '@/server/use-server/auth';

const SignUpFormSchema = CreateUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type SignUpFormValues = z.infer<typeof SignUpFormSchema>;

const SIGN_UP_FORM_FIELDS = [
  'username',
  'email',
  'password',
  'confirmPassword',
] as const satisfies readonly (keyof SignUpFormValues)[];

function isSignUpFormField(
  path: string,
): path is (typeof SIGN_UP_FORM_FIELDS)[number] {
  return (SIGN_UP_FORM_FIELDS as readonly string[]).includes(path);
}

export const SignUpComponent = () => {
  const { invokeError } = useError();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const handleCredentialResponse = async (response: {
      credential: string;
    }) => {
      const result = await signInWithGoogle({ idToken: response.credential });
      if (!result.ok) return invokeError(result.error);
      window.location.reload();
    };

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInDiv'),
        { theme: 'outline', size: 'large', text: 'signin_with' },
      );
    }
  }, [invokeError]);

  const onSubmit = handleSubmit(async (values) => {
    const result = await signUp({
      username: values.username,
      email: values.email,
      password: values.password,
    });

    if (result.ok) {
      window.location.reload();
      return;
    }

    const fieldErrors = result.error.fieldErrors;
    if (!fieldErrors || fieldErrors.length === 0) {
      invokeError(result.error);
      return;
    }

    for (const fieldError of fieldErrors) {
      if (isSignUpFormField(fieldError.path)) {
        setError(fieldError.path, { message: fieldError.message });
        continue;
      }
      invokeError(fieldError.message);
    }
  });

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
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

      <div className="flex justify-center items-center h-[44px] w-full">
        <div id="googleSignInDiv"></div>
      </div>
    </Box>
  );
};
