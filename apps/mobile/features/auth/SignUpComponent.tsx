import React, { useEffect, useState } from 'react';
import { useAuth } from '@cityborn/contexts';
import { apiClient } from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { getFriendlyErrorMessage } from '@cityborn/errors';
import TextInput from '@/components/ui/TextInput';
import { View, Text } from '@/components/ui/native/NativeComponents';
import DateTimePicker from '@react-native-community/datetimepicker';

interface FormValues {
  username: string;
  email: string;
  birthdate: Date;
  password: string;
  confirmPassword: string;
}

export const SignUpComponent = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [formValues, setFormValues] = useState<FormValues>({
    username: '',
    email: '',
    birthdate: new Date(),
    password: '',
    confirmPassword: '',
  });
  // Date picker
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);
  // validation
  const [isFormValid, setIsFormValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    validateForm();
  }, [formValues]);

  const handleChange = (key: keyof FormValues, value: any) => {
    setFormValues({
      ...formValues,
      [key]: key === 'birthdate' ? new Date(value) : value,
    });
  };

  const validateForm = () => {
    const { username, email, birthdate, password, confirmPassword } =
      formValues;

    if (!username.trim()) {
      setIsFormValid(false);
      setErrorMessage("Le nom d'utilisateur est obligatoire.");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setIsFormValid(false);
      setErrorMessage("L'adresse e-mail est invalide.");
      return;
    }

    if (!birthdate) {
      setIsFormValid(false);
      setErrorMessage('La date de naissance est obligatoire.');
      return;
    }

    if (!password.trim()) {
      setIsFormValid(false);
      setErrorMessage('Le mot de passe est obligatoire.');
      return;
    }

    if (password.length < 6) {
      setIsFormValid(false);
      setErrorMessage('Le mot de passe doit contenir au minimum 6 caractères.');
      return;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasUppercase || !hasNumber) {
      setIsFormValid(false);
      setErrorMessage(
        'Le mot de passe doit contenir au moins une majuscule et un chiffre.',
      );
      return;
    }

    if (password !== confirmPassword) {
      setIsFormValid(false);
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsFormValid(true);
    setErrorMessage(null);
  };

  const showTimepicker = () => {
    setShow(true);
  };

  const handleSubmit = async () => {
    try {
      setErrorMessage(null);
      const user = await apiClient.signUp({
        ...formValues,
        birthdate: formValues.birthdate.toString(),
      });
      setUser(user);
      router.navigate('/');
    } catch (error: any) {
      console.error(error);
      setErrorMessage(getFriendlyErrorMessage(error));
      console.error(error);
    }
  };

  return (
    <View className="flex-1 flex-col gap-8 items-center justify-center">
      <Text className="text-2xl mt-12 font-bold text-foreground">
        INSCRIPTION
      </Text>

      <View className="flex-col items-center justify-center w-auto gap-6 mb-32">
        <View className="flex-col items-center justify-center gap-6">
          <TextInput
            placeholder="Nom d'utilisateur"
            value={formValues.username}
            onChangeText={(text) => handleChange('username', text)}
            autoCapitalize="none"
            error={!!errorMessage}
          />

          <TextInput
            placeholder="Email"
            value={formValues.email}
            onChangeText={(text) => handleChange('email', text)}
            autoCapitalize="none"
            error={!!errorMessage}
          />

          <Button onPress={showTimepicker} label="Show time picker!" />
          <Text>selected: {formValues.birthdate.toLocaleString()}</Text>
          {show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={formValues.birthdate}
              is24Hour={true}
              onChange={(_event: any, selectedDate: Date | undefined) => {
                if (selectedDate) handleChange('birthdate', selectedDate);
                setShow(false);
              }}
            />
          )}

          <TextInput
            placeholder="Mot de passe"
            value={formValues.password}
            onChangeText={(text) => handleChange('password', text)}
            autoCapitalize="none"
            secureTextEntry
            error={!!errorMessage}
          />

          <TextInput
            placeholder="Confirmez le mot de passe"
            value={formValues.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
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
      </View>
    </View>
  );
};
