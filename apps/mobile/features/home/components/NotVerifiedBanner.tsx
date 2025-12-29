import Button from '@/components/ui/Button';
import { View, Text } from '@/components/ui/native/NativeComponents';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@cityborn/contexts';
import { useEffect, useState } from 'react';

export default function NotVerifiedBanner() {
  const { user } = useAuth();
  const [sentVerificationEmail, setSentVerificationEmail] = useState(false);

  const sendNewVerificationEmail = async () => {
    try {
      await apiClient.sendVerificationEmail();
      setSentVerificationEmail(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex w-70 justify-center items-center rounded-md bg-orange-400/40 py-2 px-2">
      {sentVerificationEmail ? (
        <Text className="text-center">{`Mail de vérification envoyé à l'adresse ${user?.email}`}</Text>
      ) : (
        <View>
          <Text className="text-center">Votre compte n'est pas vérifié !</Text>
          <Button
            label="Renvoyer un mail de vérification"
            variant="default"
            onPress={async () => await sendNewVerificationEmail()}
          />
        </View>
      )}
    </View>
  );
}
