import {
  type CreateUser,
  CreateUserSchema,
  resolveErrorMessage,
} from '@cityborn/api';
import { useAuth } from '@cityborn/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import { Text, View } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { signUp } from '@/lib/api/auth';
import { SignInWithAppleButton } from './AppleSignIn';
import { SignInWithGoogleButton } from './GoogleSignIn';

const SignUpFormSchema = CreateUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type SignUpFormValues = z.infer<typeof SignUpFormSchema>;

const SIGN_UP_FORM_FIELDS = [
  'username',
  'email',
  'password',
  'confirmPassword',
] as const satisfies readonly (keyof SignUpFormValues)[];

function isSignUpFormField(
  path: string,
): path is (typeof SIGN_UP_FORM_FIELDS)[number] {
  return (SIGN_UP_FORM_FIELDS as readonly string[]).includes(path);
}

export const SignUpComponent = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    const createUser: CreateUser = {
      username: values.username,
      email: values.email,
      password: values.password,
    };
    const result = await signUp(createUser);

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
      if (isSignUpFormField(fieldError.path)) {
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
      <View className="flex-col gap-8 items-center w-70 self-center">
        <Text className="text-2xl font-bold text-foreground">INSCRIPTION</Text>

        <View className="flex-col items-center justify-center gap-0 w-70">
          <View className="flex-col items-center justify-center gap-6">
            <View className="w-full relative">
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Nom d'utilisateur"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    error={!!errors.username}
                  />
                )}
              />
              {errors.username && (
                <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                  {errors.username.message}
                </Text>
              )}
            </View>

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

            <View className="w-full relative">
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Mot de passe"
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

            <View className="w-full relative">
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Confirmez le mot de passe"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    secureTextEntry
                    error={!!errors.confirmPassword}
                  />
                )}
              />
              {errors.confirmPassword && (
                <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                  {errors.confirmPassword.message}
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
            label="S'INSCRIRE"
            onPress={onSubmit}
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
