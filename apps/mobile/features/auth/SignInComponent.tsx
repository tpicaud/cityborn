import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '@cityborn/contexts';
import { apiClient } from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import TextInput from '@/components/ui/TextInput';

export const SignInComponent = () => {
  const { refreshUser } = useAuth();

  const [formValues, setFormValues] = useState({ username: '', password: '' });
  const [isSignInFormSubmitting, setIsSignInFormSubmitting] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormValues({ ...formValues, [key]: value });
  };

  const handleSubmit = async () => {
    try {
      setIsSignInFormSubmitting(true);
      await apiClient.signIn(formValues.username, formValues.password);
      await refreshUser();
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsSignInFormSubmitting(false);
    }
  };

  return (
    <View className="flex-1 flex-col gap-8 items-center justify-center">
      <Text className="text-2xl mt-12 font-bold text-foreground">
        CONNEXION
      </Text>

      <View className="flex-col items-center justify-center gap-6 mb-32">
        <TextInput
          placeholder="Username"
          value={formValues.username}
          onChangeText={(text) => handleChange('username', text)}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          value={formValues.password}
          onChangeText={(text) => handleChange('password', text)}
          secureTextEntry
        />

        <Button
          variant="filled"
          color="primary"
          size="large"
          label="SE CONNECTER"
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
};
