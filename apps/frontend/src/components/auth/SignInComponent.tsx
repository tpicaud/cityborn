'use client';

import { Box, FormControl, TextField, Typography } from '@mui/material';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useError } from '@/contexts/ErrorContext';
import { signIn, signInWithGoogle } from '@/server/actions/auth';
import Button from '../ui/buttons/Button';

export const SignInComponent = () => {
  const { invokeError } = useError();
  const [isSignInFormSubmitting, setIsSignInFormSubmitting] = useState(false);
  const [isGoogleSignInFormSubmitting, setIsGoogleSignInFormSubmitting] =
    useState(false);

  useEffect(() => {
    const handleCredentialResponse = async (response: {
      credential: string;
    }) => {
      try {
        setIsGoogleSignInFormSubmitting(true);
        const result = await signInWithGoogle(response.credential);
        if (!result.ok) return invokeError(result.error);
        window.location.reload();
      } finally {
        setIsGoogleSignInFormSubmitting(false);
      }
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

  const [formValues, setFormValues] = React.useState({
    username: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      setIsSignInFormSubmitting(true);
      e.preventDefault();
      const result = await signIn(formValues.username, formValues.password);
      if (!result.ok) return invokeError(result.error);
      window.location.reload();
    } finally {
      setIsSignInFormSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300 }}
    >
      <Typography variant="h5" align="center">
        Connexion
      </Typography>

      <FormControl>
        <TextField
          label="Username"
          name="username"
          value={formValues.username}
          onChange={handleChange}
          required
        />
      </FormControl>

      <FormControl>
        <TextField
          type="password"
          label="Password"
          name="password"
          value={formValues.password}
          onChange={handleChange}
          required
        />
      </FormControl>

      <Button
        variant="contained"
        type="submit"
        loading={isSignInFormSubmitting}
      >
        Se connecter
      </Button>

      <div className="flex flex-row gap-3 items-center w-full">
        <div className="flex-1 h-px bg-black rounded-full"></div>
        <Typography>OU</Typography>
        <div className="flex-1 h-px bg-black rounded-full"></div>
      </div>

      <div className="relative flex justify-center items-center h-[44px] w-full">
        <div id="googleSignInDiv"></div>
        {isGoogleSignInFormSubmitting && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded">
            <svg
              aria-label="Chargement"
              className="animate-spin h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
        )}
      </div>
    </Box>
  );
};
