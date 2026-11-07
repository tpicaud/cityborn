'use client';

import { type SignUpFlow, useSignUpFlow } from '@cityborn/client/auth';
import { Button, TextButton, TextField } from '@cityborn/design-system';
import { Controller } from 'react-hook-form';
import { View } from 'tamagui';
import { SignInWithGoogleButton } from './GoogleSignIn';

export function SignUpForm({ onSignIn }: { onSignIn: () => void }) {
  const {
    form: {
      control,
      formState: { errors, isSubmitting },
    },
    submit,
  }: SignUpFlow = useSignUpFlow();
  return (
    <>
      <form onSubmit={submit}>
        <View disableOptimization gap="3 md:4">
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                inputRef={ref}
                placeholder="Nom d’utilisateur"
                autoComplete="username"
                error={errors.username?.message}
                disabled={isSubmitting}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                inputRef={ref}
                placeholder="Adresse e-mail"
                autoComplete="email"
                error={errors.email?.message}
                disabled={isSubmitting}
                inputMode="email"
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                inputRef={ref}
                placeholder="Mot de passe"
                autoComplete="new-password"
                error={errors.password?.message}
                disabled={isSubmitting}
                secureTextEntry
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                inputRef={ref}
                placeholder="Confirme ton mot de passe"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                disabled={isSubmitting}
                secureTextEntry
                returnKeyType="done"
              />
            )}
          />
          <Button
            compact
            label="S’inscrire"
            onPress={submit}
            loading={isSubmitting}
          />
        </View>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
      <TextButton label="Déjà un compte ? Se connecter" onPress={onSignIn} />
      <View gap="4 md:6" items="center">
        <SignInWithGoogleButton />
      </View>
    </>
  );
}
