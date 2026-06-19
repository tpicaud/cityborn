'use client';

import { Box, Button, FormControl, TextField, Typography } from '@mui/material';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useError } from '@/contexts/ErrorContext';
import { signInWithGoogle, signUp } from '@/server/actions/auth';

interface FormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const SignUpComponent = () => {
  const { invokeError } = useError();
  const [isSignUpFormSubmitting, setIsSignUpFormSubmitting] = useState(false);

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

  const [formValues, setFormValues] = React.useState<FormValues>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [touched, setTouched] = React.useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSignUpFormSubmitting(true);

    if (formValues.password !== formValues.confirmPassword) {
      invokeError('Les mots de passe ne correspondent pas');
      setIsSignUpFormSubmitting(false);
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(formValues.password)) {
      invokeError(
        'Le mot de passe doit contenir au moins une majuscule et un chiffre.',
      );
      setIsSignUpFormSubmitting(false);
      return;
    }

    try {
      const result = await signUp({
        username: formValues.username,
        email: formValues.email,
        password: formValues.password,
      });
      if (!result.ok) return invokeError(result.error);
      window.location.reload();
    } finally {
      setIsSignUpFormSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300 }}
    >
      <Typography variant="h5" align="center">
        Inscription
      </Typography>

      <FormControl>
        <TextField
          label="Username"
          name="username"
          value={formValues.username}
          onChange={handleChange}
          onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
          required
          error={touched.username && !formValues.username}
        />
      </FormControl>

      <FormControl>
        <TextField
          type="email"
          label="Email"
          name="email"
          value={formValues.email}
          onChange={handleChange}
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
          required
          error={touched.email && !formValues.email}
        />
      </FormControl>

      <FormControl>
        <TextField
          type="password"
          label="Password"
          name="password"
          value={formValues.password}
          onChange={handleChange}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          required
          error={touched.password && !formValues.password}
        />
      </FormControl>

      <FormControl>
        <TextField
          type="password"
          label="Confirm Password"
          name="confirmPassword"
          value={formValues.confirmPassword}
          onChange={handleChange}
          onBlur={() =>
            setTouched((prev) => ({ ...prev, confirmPassword: true }))
          }
          required
          error={touched.confirmPassword && !formValues.confirmPassword}
        />
      </FormControl>

      <Button
        variant="contained"
        type="submit"
        loading={isSignUpFormSubmitting}
      >
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
