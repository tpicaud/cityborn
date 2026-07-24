import { getFriendlyErrorMessage } from '@cityborn/api';
import { useAuth } from '@cityborn/contexts';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Button from '@/components/ui/Button';
import { Text, View } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { signUp } from '@/lib/api/auth';
import { SignInWithAppleButton } from './AppleSignIn';
import { SignInWithGoogleButton } from './GoogleSignIn';

interface FormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const SignUpComponent = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [formValues, setFormValues] = useState<FormValues>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (key: keyof FormValues, value: any) => {
    setFormValues({
      ...formValues,
      [key]: value,
    });
    setErrors({ ...errors, [key]: null });
  };

  const validateInput = (field: keyof FormValues, value: any) => {
    setErrors((prev) => {
      const newErrors = { ...prev };

      switch (field) {
        case 'username':
          if (!String(value).trim()) {
            newErrors.username = "Nom d'utilisateur obligatoire";
          } else {
            delete newErrors.username;
          }
          break;

        case 'email':
          if (!String(value).trim()) {
            newErrors.email = 'Email obligatoire';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            newErrors.email = 'Email invalide';
          } else {
            delete newErrors.email;
          }
          break;

        case 'password': {
          const password = value;
          if (!password?.trim()) {
            newErrors.password = 'Mot de passe obligatoire';
          } else if (password.length < 6) {
            newErrors.password = 'Minimum 6 caractères requis';
          } else if (!/[A-Z]/.test(password) || !/\d/.test(password)) {
            newErrors.password =
              'Doit contenir au moins une majuscule et un chiffre';
          } else {
            delete newErrors.password;
          }

          if (
            formValues.confirmPassword &&
            formValues.confirmPassword !== password
          ) {
            newErrors.confirmPassword =
              'Les mots de passe ne correspondent pas';
          } else {
            delete newErrors.confirmPassword;
          }

          break;
        }

        case 'confirmPassword': {
          const confirm = value;
          if (!confirm?.trim()) {
            newErrors.confirmPassword = 'Confirmation obligatoire';
          } else if (confirm !== formValues.password) {
            newErrors.confirmPassword =
              'Les mots de passe ne correspondent pas';
          } else {
            delete newErrors.confirmPassword;
          }
          break;
        }
      }

      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    validateInput('username', formValues.username);
    validateInput('email', formValues.email);
    validateInput('password', formValues.password);
    validateInput('confirmPassword', formValues.confirmPassword);

    const noErrors = Object.keys(errors).length === 0;
    if (!noErrors) setErrorMessage('Le formulaire est invalide.');
    return noErrors;
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (
      !formValues.username ||
      !formValues.email ||
      !formValues.password ||
      !formValues.confirmPassword
    ) {
      validateForm();
      return;
    }

    if (!validateForm()) return;

    const result = await signUp({ ...formValues });
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
      <View className="flex-col gap-8 items-center w-70 self-center">
        <Text className="text-2xl font-bold text-foreground">INSCRIPTION</Text>

        <View className="flex-col items-center justify-center gap-0 w-70">
          <View className="flex-col items-center justify-center gap-6">
            <View className="w-full relative">
              <TextInput
                placeholder="Nom d'utilisateur"
                value={formValues.username}
                onChangeText={(text) => handleChange('username', text)}
                onBlur={() => validateInput('username', formValues.username)}
                autoCapitalize="none"
                error={!!errors.username}
              />

              {errors.username && (
                <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                  {errors.username}
                </Text>
              )}
            </View>

            <View className="w-full relative">
              <TextInput
                placeholder="Email"
                value={formValues.email}
                onChangeText={(text) => handleChange('email', text)}
                onBlur={() => validateInput('email', formValues.email)}
                autoCapitalize="none"
                error={!!errors.email}
              />
              {errors.email && (
                <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                  {errors.email}
                </Text>
              )}
            </View>

            <View className="w-full relative">
              <TextInput
                placeholder="Mot de passe"
                value={formValues.password}
                onChangeText={(text) => handleChange('password', text)}
                onBlur={() => validateInput('password', formValues.password)}
                autoCapitalize="none"
                secureTextEntry
                error={!!errors.password}
              />
              {errors.password && (
                <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                  {errors.password}
                </Text>
              )}
            </View>

            <View className="w-full relative">
              <TextInput
                placeholder="Confirmez le mot de passe"
                value={formValues.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
                onBlur={() =>
                  validateInput('confirmPassword', formValues.confirmPassword)
                }
                autoCapitalize="none"
                secureTextEntry
                error={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                  {errors.confirmPassword}
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
            label="S'INSCRIRE"
            onPress={handleSubmit}
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
