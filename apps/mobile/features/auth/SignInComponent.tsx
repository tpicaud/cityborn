import React, { useEffect, useState } from 'react';
import { useAuth } from '@cityborn/contexts';
import { apiClient } from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { getFriendlyErrorMessage } from '@cityborn/errors';
import TextInput from '@/components/ui/TextInput';
import { View, Text } from '@/components/ui/native/NativeComponents';
import { useError } from '@cityborn/contexts';

interface FormValues {
  username: string;
  password: string;
}

export const SignInComponent = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const { invokeError } = useError();
  const [formValues, setFormValues] = useState<FormValues>({
    username: '',
    password: '',
  });
  const [isFormValid, setIsFormValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    validateForm();
  }, [formValues]);

  const handleChange = (key: string, value: string) => {
    setFormValues({ ...formValues, [key]: value });
  };

  const validateForm = () => {
    if (
      formValues.username.trim() !== '' &&
      formValues.password.trim() !== ''
    ) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setErrorMessage(null);
      const user = await apiClient.signIn(
        formValues.username,
        formValues.password,
      );
      setUser(user);
      router.navigate('/');
    } catch (error: any) {
      setErrorMessage(getFriendlyErrorMessage(error));
      console.error(error);
    }
  };

  return (
    <View className="flex-1 flex-col gap-8 items-center justify-center">
      <Text className="text-2xl mt-12 font-bold text-foreground">
        CONNEXION
      </Text>

      <View className="flex-col items-center justify-center w-auto gap-6 mb-32">
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
        />
      </View>
    </View>
  );
};
