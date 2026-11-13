'use client';

import type { User } from '@cityborn/api';
import { type SignOut, useSignOut } from '@cityborn/client/auth';
import type { Navigation } from '@cityborn/client/platform';
import { type ProfileEditor, useProfileEditor } from '@cityborn/client/profile';
import {
  BodyText,
  Button,
  FormFields,
  Panel,
  PanelTitle,
  Screen,
  TextField,
} from '@cityborn/design-system';
import { Controller } from 'react-hook-form';
import { View } from 'tamagui';
import { useNavigation } from '@/lib/navigation';

type EditProfileProps = {
  user: User;
  onBack: () => void;
};

function HiddenSubmit() {
  return <button type="submit" hidden aria-hidden="true" tabIndex={-1} />;
}

export function EditProfile({ user, onBack }: EditProfileProps) {
  const navigation: Navigation = useNavigation();
  const { signOut }: SignOut = useSignOut({
    onSignedOut: () => navigation.returnTo('/'),
  });
  const {
    usernameForm,
    isUsernameUpdated,
    submitUsername,
    emailForm,
    isEmailUpdated,
    submitEmail,
    passwordForm,
    isPasswordUpdated,
    submitPassword,
  }: ProfileEditor = useProfileEditor();

  return (
    <Screen title="Compte" onBack={onBack} scrollable>
      <View gap="3 md:5">
        <Panel>
          <PanelTitle>Pseudo</PanelTitle>
          <form onSubmit={submitUsername}>
            <FormFields>
              <Controller
                control={usernameForm.control}
                name="username"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <TextField
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    inputRef={ref}
                    placeholder="Pseudo"
                    autoComplete="username"
                    error={usernameForm.formState.errors.username?.message}
                    disabled={usernameForm.formState.isSubmitting}
                  />
                )}
              />
              {isUsernameUpdated && (
                <BodyText role="status">Pseudo modifié.</BodyText>
              )}
              <Button
                compact
                variant="secondary"
                label="Enregistrer"
                onPress={submitUsername}
                loading={usernameForm.formState.isSubmitting}
              />
            </FormFields>
            <HiddenSubmit />
          </form>
        </Panel>
        {!user.isVerified && (
          <Panel>
            <PanelTitle>E-mail</PanelTitle>
            <form onSubmit={submitEmail}>
              <FormFields>
                <Controller
                  control={emailForm.control}
                  name="email"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextField
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      inputRef={ref}
                      placeholder="Adresse e-mail"
                      inputMode="email"
                      autoComplete="email"
                      error={emailForm.formState.errors.email?.message}
                      disabled={emailForm.formState.isSubmitting}
                    />
                  )}
                />
                {isEmailUpdated && (
                  <BodyText role="status">
                    Lien de vérification envoyé à ta nouvelle adresse.
                  </BodyText>
                )}
                <Button
                  compact
                  variant="secondary"
                  label="Corriger l’e-mail"
                  onPress={submitEmail}
                  loading={emailForm.formState.isSubmitting}
                />
              </FormFields>
              <HiddenSubmit />
            </form>
          </Panel>
        )}
        {user.type === 'email' && (
          <Panel>
            <PanelTitle>Mot de passe</PanelTitle>
            <form onSubmit={submitPassword}>
              <FormFields>
                <Controller
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextField
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      inputRef={ref}
                      placeholder="Mot de passe actuel"
                      autoComplete="current-password"
                      error={
                        passwordForm.formState.errors.currentPassword?.message
                      }
                      disabled={passwordForm.formState.isSubmitting}
                      secureTextEntry
                    />
                  )}
                />
                <Controller
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextField
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      inputRef={ref}
                      placeholder="Nouveau mot de passe"
                      autoComplete="new-password"
                      error={passwordForm.formState.errors.newPassword?.message}
                      disabled={passwordForm.formState.isSubmitting}
                      secureTextEntry
                    />
                  )}
                />
                <Controller
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextField
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      inputRef={ref}
                      placeholder="Confirmation du nouveau mot de passe"
                      autoComplete="new-password"
                      error={
                        passwordForm.formState.errors.confirmPassword?.message
                      }
                      disabled={passwordForm.formState.isSubmitting}
                      secureTextEntry
                    />
                  )}
                />
                {isPasswordUpdated && (
                  <BodyText role="status">
                    Ton mot de passe a été modifié.
                  </BodyText>
                )}
                <Button
                  compact
                  variant="secondary"
                  label="Changer le mot de passe"
                  onPress={submitPassword}
                  loading={passwordForm.formState.isSubmitting}
                />
              </FormFields>
              <HiddenSubmit />
            </form>
          </Panel>
        )}
        <Button
          compact
          variant="outline"
          label="Se déconnecter"
          onPress={signOut}
        />
      </View>
    </Screen>
  );
}
