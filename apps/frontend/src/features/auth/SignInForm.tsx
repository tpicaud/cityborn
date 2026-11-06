'use client';

import { type SignInFlow, useSignInFlow } from '@cityborn/client/auth';
import type { Navigation } from '@cityborn/client/platform';
import { Button, FormText, TextField } from '@cityborn/design-system';
import { Controller } from 'react-hook-form';
import { View } from 'tamagui';
import { LegalLinks } from '@/features/legal-information/LegalLinks';
import { useNavigation } from '@/lib/navigation';
import { AuthScreen } from './AuthScreen';
import { SignInWithGoogleButton } from './GoogleSignIn';
import { RequestPasswordResetDialog } from './RequestPasswordResetDialog';

export function SignInForm() {
  const navigation: Navigation = useNavigation();
  const {
    form: {
      control,
      formState: { errors, isSubmitting },
    },
    submit,
  }: SignInFlow = useSignInFlow({ onSignedIn: () => navigation.returnTo('/') });
  return (
    <AuthScreen title="Connexion">
      <form onSubmit={submit}>
        <View disableOptimization gap="3 md:4">
          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                inputRef={ref}
                placeholder="E-mail ou nom d’utilisateur"
                autoComplete="username"
                error={errors.identifier?.message}
                disabled={isSubmitting}
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
                autoComplete="current-password"
                error={errors.password?.message}
                disabled={isSubmitting}
                secureTextEntry
                returnKeyType="done"
              />
            )}
          />
          <Button
            compact
            label="Se connecter"
            onPress={submit}
            loading={isSubmitting}
          />
        </View>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
      <RequestPasswordResetDialog />
      <View gap="3" self="center" w="100%" maxW="md:96">
        <FormText disableOptimization fontWeight="700">
          Pas encore de compte ?
        </FormText>
        <Button
          compact
          label="S’inscrire"
          variant="secondary"
          onPress={() => navigation.push('/auth/sign-up')}
        />
      </View>
      <View gap="4 md:6" items="center">
        <SignInWithGoogleButton />
      </View>
      <LegalLinks onDarkBackground />
    </AuthScreen>
  );
}
