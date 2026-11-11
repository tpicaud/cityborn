'use client';

import {
  type PasswordResetRequestFlow,
  usePasswordResetRequestFlow,
} from '@cityborn/client/auth';
import {
  BodyText,
  Button,
  Popup,
  TextButton,
  TextField,
} from '@cityborn/design-system';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { ScrollView, View } from 'tamagui';

export function RequestPasswordResetDialog() {
  const [open, setOpen] = useState<boolean>(false);
  const {
    form: {
      control,
      formState: { errors, isSubmitting },
    },
    message,
    reset,
    submit,
  }: PasswordResetRequestFlow = usePasswordResetRequestFlow();
  return (
    <>
      <TextButton
        label="Mot de passe oublié ?"
        onPress={() => {
          reset();
          setOpen(true);
        }}
      />
      <Popup
        open={open}
        onClose={() => {
          if (!isSubmitting) setOpen(false);
        }}
        title="Mot de passe oublié"
      >
        <ScrollView maxH="96" keyboardShouldPersistTaps="handled">
          <View gap="4">
            {message ? (
              <BodyText role="status">{message}</BodyText>
            ) : (
              <>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextField
                      inputRef={ref}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Adresse e-mail"
                      inputMode="email"
                      autoComplete="email"
                      error={errors.email?.message}
                      disabled={isSubmitting}
                      returnKeyType="done"
                      onSubmitEditing={() => void submit()}
                    />
                  )}
                />
                <Button
                  compact
                  label="Envoyer le lien"
                  onPress={submit}
                  loading={isSubmitting}
                />
              </>
            )}
            <TextButton
              label="Fermer"
              disabled={isSubmitting}
              onPress={() => setOpen(false)}
            />
          </View>
        </ScrollView>
      </Popup>
    </>
  );
}
