import {
  useVerificationEmailResend,
  type VerificationEmailResend,
} from '@cityborn/client/auth';
import { Pressable } from 'react-native';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { cn } from '@/lib/classNames';

export function EmailVerificationNotice() {
  const verificationEmailResend: VerificationEmailResend =
    useVerificationEmailResend();

  return (
    <View className="flex flex-col items-center gap-2 self-center rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 w-full max-w-xs">
      <Text className="text-sm font-medium text-amber-900 text-center">
        Ton adresse e-mail n'est pas vérifiée
      </Text>
      <Pressable
        onPress={verificationEmailResend.resend}
        disabled={
          verificationEmailResend.isSent || verificationEmailResend.isSending
        }
      >
        {verificationEmailResend.isSending ? (
          <LoaderIcon size={18} color="#92400e" />
        ) : (
          <Text
            className={cn(
              'text-sm font-medium',
              verificationEmailResend.isSent
                ? 'text-amber-900/50'
                : 'text-amber-900 underline',
            )}
          >
            {verificationEmailResend.isSent
              ? 'E-mail de vérification envoyé'
              : 'Renvoyer un e-mail de vérification'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
