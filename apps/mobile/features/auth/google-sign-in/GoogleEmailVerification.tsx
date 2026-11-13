import type { IdentityProviderSignIn } from '@cityborn/client/auth';
import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';

export function GoogleEmailVerification({
  flow,
}: {
  flow: IdentityProviderSignIn;
}) {
  const [code, setCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const confirm = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await flow.confirmGoogleEmail(code);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-3 p-4">
      <Text>
        Confirmez votre connexion Google avec le code à 8 chiffres envoyé à
        votre adresse e-mail. L’association conserve votre progression et vos
        connexions existantes.
      </Text>
      <TextInput
        accessibilityLabel="Code de confirmation Google"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        maxLength={8}
        editable={!isSubmitting}
        className="border rounded p-3"
      />
      <Button
        title="Confirmer et associer Google"
        onPress={confirm}
        disabled={isSubmitting || code.length !== 8}
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
