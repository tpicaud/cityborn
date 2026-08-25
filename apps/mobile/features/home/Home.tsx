import { toAppError, useAuth, useError } from '@cityborn/client';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Image, Pressable } from 'react-native';
import Button from '@/components/ui/Button';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { resendVerificationEmail, signOut } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const { user, setUser, refreshUser } = useAuth();
  const { invokeError } = useError();
  const [isSendingVerificationEmail, setIsSendingVerificationEmail] =
    useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refreshUser();
    });
    return () => subscription.remove();
  }, [refreshUser]);

  const handleResendVerificationEmail = async () => {
    setIsSendingVerificationEmail(true);
    const result = await resendVerificationEmail();
    setIsSendingVerificationEmail(false);
    if (!result.ok) return invokeError(toAppError(result.error));
    setVerificationEmailSent(true);
  };

  return (
    <View className="flex-1 w-70 self-center">
      <View className=" flex-1 flex flex-col justify-center items-center gap-6">
        <Image
          source={require('../../assets/images/logo.png')}
          resizeMode="contain"
          className="mb-6 rounded-xl w-40 h-40 md:w-48 md:h-48 lg:w-64 lg:h-64"
        />
        {user ? (
          <View className="flex flex-col justify-center items-center gap-8">
            <Text className="text-3xl text-center">
              Bienvenue <Text className="font-bold">{user.username}</Text>
            </Text>

            {user.isVerified === false && (
              <View className="flex flex-col items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 w-full max-w-xs">
                <Text className="text-sm font-medium text-amber-900 text-center">
                  Ton adresse e-mail n'est pas vérifiée
                </Text>
                <Pressable
                  onPress={handleResendVerificationEmail}
                  disabled={verificationEmailSent || isSendingVerificationEmail}
                >
                  {isSendingVerificationEmail ? (
                    <LoaderIcon size={18} color="#92400e" />
                  ) : (
                    <Text
                      className={cn(
                        'text-sm font-medium',
                        verificationEmailSent
                          ? 'text-amber-900/50'
                          : 'text-amber-900 underline',
                      )}
                    >
                      {verificationEmailSent
                        ? 'E-mail de vérification envoyé'
                        : 'Renvoyer un e-mail de vérification'}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            <View className="flex flex-col gap-6 items-center justify-center">
              <Button
                color="primary"
                variant="filled"
                label="JOUER"
                size="large"
                onPress={() => router.navigate('/(tabs)/play')}
              />
              <Button
                variant="default"
                label="Déconnexion"
                onPress={async () => {
                  await signOut();
                  setUser(null);
                }}
              />
            </View>
          </View>
        ) : (
          <View className="flex flex-col w-full items-center justify-between gap-6">
            <Button
              color="primary"
              variant="outlined"
              label="CONNEXION"
              size="large"
              onPress={() => router.navigate('/auth/sign-in')}
            />
            <Button
              color="primary"
              variant="filled"
              label="INSCRIPTION"
              size="large"
              onPress={() => router.navigate('/auth/sign-up')}
            />
            <Button
              variant="default"
              label="Joue sans compte"
              onPress={() => router.navigate('/(tabs)/play')}
            />
          </View>
        )}
      </View>
    </View>
  );
}
