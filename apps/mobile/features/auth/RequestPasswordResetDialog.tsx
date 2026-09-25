import type { ApiResult, PasswordResetRequestResponse } from '@cityborn/api';
import { useError } from '@cityborn/client';
import { useRequestPasswordResetForm } from '@cityborn/client/auth';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { Text, View } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { authApi } from '@/lib/api/auth';

export function RequestPasswordResetDialog() {
  const [open, setOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const { invokeError } = useError();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useRequestPasswordResetForm();
  const onSubmit = handleSubmit(async (values) => {
    try {
      const result: ApiResult<PasswordResetRequestResponse> =
        await authApi.requestPasswordReset(values);
      if (!result.ok) return invokeError(result.error);
      setMessage(result.data.message);
    } catch (error) {
      invokeError(error);
    }
  });

  return (
    <>
      <Button
        variant="default"
        label="Mot de passe oublié ?"
        onPress={() => {
          setMessage(null);
          setOpen(true);
        }}
      />
      <Dialog
        visible={open}
        onClose={() => {
          if (!isSubmitting) setOpen(false);
        }}
        title="Réinitialiser son mot de passe"
        className="h-auto max-h-[85%]"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="gap-4 w-full">
              {message ? (
                <Text accessibilityLiveRegion="polite">{message}</Text>
              ) : (
                <>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        accessibilityLabel="Adresse e-mail"
                        placeholder="Adresse e-mail"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.email}
                      />
                    )}
                  />
                  {errors.email && (
                    <Text className="text-destructive-500">
                      {errors.email.message}
                    </Text>
                  )}
                  {isSubmitting && (
                    <ActivityIndicator accessibilityLabel="Envoi en cours" />
                  )}
                  <Button
                    label="Envoyer le lien de réinitialisation"
                    className="w-full h-auto min-h-14 py-3"
                    disabled={isSubmitting}
                    onPress={() => {
                      if (!isSubmitting) void onSubmit();
                    }}
                  />
                </>
              )}
              <Button
                variant="ghost"
                label="Fermer"
                disabled={isSubmitting}
                onPress={() => setOpen(false)}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Dialog>
    </>
  );
}
