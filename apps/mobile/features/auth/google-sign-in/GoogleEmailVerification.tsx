import type { IdentityProviderSignIn } from '@cityborn/client/auth';
import { Controller } from 'react-hook-form';
import { Button, Text, TextInput, View } from 'react-native';

export function GoogleEmailVerification({
  flow,
}: {
  flow: IdentityProviderSignIn;
}) {
  const {
    googleEmailVerificationForm: {
      control,
      formState: { errors, isSubmitting },
    },
  }: IdentityProviderSignIn = flow;

  return (
    <View className="gap-3 p-4">
      <Text>
        Confirmez votre connexion Google avec le code à 8 chiffres envoyé à
        votre adresse e-mail. L’association conserve votre progression et vos
        connexions existantes.
      </Text>
      <Controller
        control={control}
        name="emailVerificationCode"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextInput
            ref={ref}
            accessibilityLabel="Code de confirmation Google"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={8}
            editable={!isSubmitting}
            className="border rounded p-3"
          />
        )}
      />
      {errors.emailVerificationCode && (
        <Text accessibilityRole="alert">
          {errors.emailVerificationCode.message}
        </Text>
      )}
      <Button
        title="Confirmer et associer Google"
        onPress={flow.confirmGoogleEmail}
        disabled={isSubmitting}
      />
      <Button
        title="Renvoyer le code (après 3 minutes)"
        onPress={flow.resendGoogleEmailVerification}
        disabled={isSubmitting}
      />
      <Button
        title="Annuler"
        onPress={flow.cancelGoogleEmailVerification}
        disabled={isSubmitting}
      />
    </View>
  );
}
