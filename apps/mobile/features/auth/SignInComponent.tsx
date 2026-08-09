import { getFriendlyErrorMessage } from '@cityborn/api';
import { useAuth } from '@cityborn/contexts';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Button from '@/components/ui/Button';
import { Text, View } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { signIn } from '@/lib/api/auth';
import { SignInWithAppleButton } from './AppleSignIn';
import { SignInWithGoogleButton } from './GoogleSignIn';

interface FormValues {
  username: string;
  password: string;
}

export const SignInComponent = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [formValues, setFormValues] = useState<FormValues>({
    username: '',
    password: '',
  });
  const isFormValid =
    formValues.username.trim() !== '' && formValues.password.trim() !== '';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setFormValues({ ...formValues, [key]: value });
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    const result = await signIn({
      identifier: formValues.username,
      password: formValues.password,
    });
    if (!result.ok)
      return setErrorMessage(getFriendlyErrorMessage(result.error));
    setUser(result.data);
    router.push('/');
  };

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
            <TextInput
              placeholder="Username"
              value={formValues.username}
              onChangeText={(text) => handleChange('username', text)}
              autoCapitalize="none"
              error={!!errorMessage}
            />

            <TextInput
              placeholder="Password"
              value={formValues.password}
              onChangeText={(text) => handleChange('password', text)}
              autoCapitalize="none"
              secureTextEntry
              error={!!errorMessage}
            />

            <Text className="w-68 text-destructive-500 text-center text-ellipsis overflow-hidden">
              {errorMessage}
            </Text>
          </View>
          <Button
            variant="filled"
            color="primary"
            size="large"
            disabled={!isFormValid}
            label="SE CONNECTER"
            onPress={handleSubmit}
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
