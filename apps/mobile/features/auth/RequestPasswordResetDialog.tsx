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
import { type ReactNode, useState } from 'react';
import { Controller } from 'react-hook-form';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { ScrollView, View } from 'tamagui';

function PasswordResetPopupContainer({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      pointerEvents="box-none"
      style={{ flex: 1, width: '100%' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        flex={1}
        items="center"
        justify="center"
        py="4"
        pointerEvents="box-none"
      >
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}

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
        contentContainer={PasswordResetPopupContainer}
      >
        <ScrollView shrink={1} keyboardShouldPersistTaps="handled">
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
