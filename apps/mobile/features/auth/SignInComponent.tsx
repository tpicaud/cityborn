import { resolveErrorMessage, type SignIn, SignInSchema } from '@cityborn/api';
import { useAuth } from '@cityborn/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Button from '@/components/ui/Button';
import { Text, View } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { signIn } from '@/lib/api/auth';
import { SignInWithAppleButton } from './AppleSignIn';
import { SignInWithGoogleButton } from './GoogleSignIn';

const SIGN_IN_FORM_FIELDS = [
  'identifier',
  'password',
] as const satisfies readonly (keyof SignIn)[];

function isSignInFormField(
  path: string,
): path is (typeof SIGN_IN_FORM_FIELDS)[number] {
  return (SIGN_IN_FORM_FIELDS as readonly string[]).includes(path);
}

export const SignInComponent = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignIn>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);
    const result = await signIn(values);

    if (result.ok) {
      setUser(result.data);
      router.push('/');
      return;
    }

    const fieldErrors = result.error.fieldErrors;
    if (!fieldErrors || fieldErrors.length === 0) {
      setErrorMessage(resolveErrorMessage(result.error));
      return;
    }

    for (const fieldError of fieldErrors) {
      if (isSignInFormField(fieldError.path)) {
        setError(fieldError.path, { message: fieldError.message });
        continue;
      }
      setErrorMessage(fieldError.message);
    }
  });

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      enableOnAndroid
    >
      <View className="flex-1 flex-col gap-8 items-center w-70 self-center justify-center">
        <Text className="text-2xl font-bold text-foreground">CONNEXION</Text>

        <View className="flex-col items-center justify-center w-auto gap-0">
          <View className="flex-col items-center justify-center gap-6">
            <View className="w-full relative">
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Username"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    error={!!errors.identifier}
                  />
                )}
              />
              {errors.identifier && (
                <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                  {errors.identifier.message}
                </Text>
              )}
            </View>

            <View className="w-full relative">
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    secureTextEntry
                    error={!!errors.password}
                  />
                )}
              />
              {errors.password && (
                <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                  {errors.password.message}
                </Text>
              )}
            </View>

            <Text className="w-68 text-destructive-500 text-center text-ellipsis overflow-hidden">
              {errorMessage}
            </Text>
          </View>
          <Button
            variant="filled"
            color="primary"
            size="large"
            disabled={isSubmitting}
            label="SE CONNECTER"
            onPress={onSubmit}
          />
          <Button
            variant="default"
            label="Pas de compte ? Inscris-toi ici !"
            onPress={() => router.navigate('/auth/sign-up')}
            className="mt-6"
          />
        </View>
        <View className="flex flex-row items-center gap-2 w-full">
          <View className="flex-1  h-px bg-foreground" />
          <Text>OU</Text>
          <View className="flex-1 h-px bg-foreground" />
        </View>

        <View className="flex flex-col gap-4 justify-center items-center">
          <SignInWithGoogleButton />
          {Platform.OS === 'ios' && <SignInWithAppleButton />}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};
