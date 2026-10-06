import type { ApiResult, PasswordResetRequestResponse } from '@cityborn/api';
import { useError } from '@cityborn/client';
import { useRequestPasswordResetForm } from '@cityborn/client/auth';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { ScrollView } from 'react-native';
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
    reset,
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
          reset();
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
        <ScrollView
          style={{ width: '100%' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-4 w-full">
            {message ? (
              <Text accessibilityLiveRegion="polite">{message}</Text>
            ) : (
              <>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextInput
                      ref={ref}
                      className="w-full"
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
                <Button
                  label="Envoyer le lien de réinitialisation"
                  className="w-full h-auto min-h-14 py-3"
                  disabled={isSubmitting}
                  onPress={() => onSubmit()}
                />
              </>
            )}
            <Button
              variant="ghost"
              label="Fermer"
              className="self-center"
              disabled={isSubmitting}
              onPress={() => setOpen(false)}
            />
          </View>
        </ScrollView>
      </Dialog>
    </>
  );
}
