import {
  type PasswordResetRequestFlow,
  usePasswordResetRequestFlow,
} from '@cityborn/client/auth';
import { colors } from '@cityborn/design-system';
import { useRouter } from 'expo-router';
import { Controller } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Button from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';

export const ForgotPasswordForm = () => {
  const router = useRouter();
  const {
    form: {
      control,
      formState: { errors, isSubmitting },
    },
    submit,
    requestedEmail,
  }: PasswordResetRequestFlow = usePasswordResetRequestFlow();

  if (requestedEmail)
    return (
      <View className="flex-1 flex-col gap-6 items-center justify-center w-70 self-center">
        <Icon name="mail_outline" size={48} color={colors.primary[500]} />
        <Text className="text-2xl font-bold text-foreground text-center">
          VÉRIFIE TES E-MAILS
        </Text>
        <Text className="text-center">
          Si un compte Cityborn est associé à{' '}
          <Text className="font-bold">{requestedEmail}</Text>, un lien pour
          choisir un nouveau mot de passe vient d'y être envoyé.
        </Text>
        <Button
          variant="filled"
          color="primary"
          size="large"
          label="SE CONNECTER"
          onPress={() => router.dismissTo('/auth/sign-in')}
        />
      </View>
    );

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      enableOnAndroid
    >
      <View className="flex-col gap-8 items-center w-70 self-center">
        <Text className="text-2xl font-bold text-foreground text-center">
          MOT DE PASSE OUBLIÉ
        </Text>
        <Text className="text-center">
          Saisis l'adresse e-mail de ton compte pour recevoir un lien de
          réinitialisation.
        </Text>
        <View className="w-full relative">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                keyboardType="email-address"
                error={!!errors.email}
              />
            )}
          />
          {errors.email && (
            <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
              {errors.email.message}
            </Text>
          )}
        </View>
        <Button
          variant="filled"
          color="primary"
          size="large"
          disabled={isSubmitting}
          label="ENVOYER LE LIEN"
          onPress={submit}
        />
      </View>
    </KeyboardAwareScrollView>
  );
};
