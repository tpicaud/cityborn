'use client';

import { type SignInFlow, useSignInFlow } from '@cityborn/client/auth';
import type { Navigation } from '@cityborn/client/platform';
import {
  ActionPrompt,
  Button,
  FormFields,
  TextField,
} from '@cityborn/design-system';
import { Controller } from 'react-hook-form';
import { useNavigation } from '@/lib/navigation';
import { RequestPasswordResetDialog } from './RequestPasswordResetDialog';

export function SignInForm({ onSignUp }: { onSignUp: () => void }) {
  const navigation: Navigation = useNavigation();
  const {
    form: {
      control,
      formState: { errors, isSubmitting },
    },
    submit,
  }: SignInFlow = useSignInFlow({ onSignedIn: () => navigation.returnTo('/') });
  return (
    <>
      <form onSubmit={submit}>
        <FormFields disableOptimization>
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
        </FormFields>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
      <RequestPasswordResetDialog />
      <ActionPrompt prompt="Pas encore de compte ?">
        <Button
          compact
          label="S’inscrire"
          variant="secondary"
          onPress={onSignUp}
        />
      </ActionPrompt>
    </>
  );
}
