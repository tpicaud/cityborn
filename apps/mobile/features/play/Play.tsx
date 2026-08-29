import { SessionMode } from '@cityborn/api';
import { useAuth, useError } from '@cityborn/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { Text, View } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { createSession, fetchSession } from '@/lib/api/session';

const JoinSessionSchema = z.object({
  code: z.string().min(1, 'Veuillez entrer un code'),
});

type JoinSessionFormValues = z.infer<typeof JoinSessionSchema>;

const JOIN_SESSION_FORM_FIELDS = [
  'code',
] as const satisfies readonly (keyof JoinSessionFormValues)[];

function isJoinSessionFormField(
  path: string,
): path is (typeof JOIN_SESSION_FORM_FIELDS)[number] {
  return (JOIN_SESSION_FORM_FIELDS as readonly string[]).includes(path);
}

export default function Play() {
  const { user } = useAuth();
  const { invokeError } = useError();
  const router = useRouter();
  const [openConnectionAlert, setOpenConnectionAlert] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JoinSessionFormValues>({
    resolver: zodResolver(JoinSessionSchema),
    defaultValues: { code: '' },
  });

  const handleSoloPlay = () => {
    router.navigate('/session/solo');
  };

  const handleMultiPlay = async () => {
    if (!user) {
      setOpenConnectionAlert(true);
    } else {
      const result = await createSession({ mode: SessionMode.MULTI });
      if (!result.ok) return invokeError(result.error);
      router.navigate(`/session/multi/${result.data.id}`);
    }
  };

  const handleJoin = handleSubmit(async (values) => {
    const result = await fetchSession(values.code);
    if (result.ok) {
      router.push(`/session/multi/${values.code}`);
      return;
    }

    const fieldErrors = result.error.fieldErrors;
    if (!fieldErrors || fieldErrors.length === 0) {
      invokeError(result.error);
      return;
    }

    for (const fieldError of fieldErrors) {
      if (isJoinSessionFormField(fieldError.path)) {
        setError(fieldError.path, { message: fieldError.message });
        continue;
      }
      invokeError(fieldError.message);
    }
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 w-70 self-center">
        <View className="flex-1 justify-center items-center gap-10">
          <View className="h-[45%] flex justify-end items-center gap-4">
            <Text className="text-2xl">Rejoindre</Text>
            <View className="flex flex-row w-50 h-12">
              <Controller
                control={control}
                name="code"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    placeholder="Entrez le code"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    className="flex-1 rounded-r-none pl-3 h-full border"
                    keyboardType="numeric"
                    maxLength={6}
                    error={!!errors.code}
                  />
                )}
              />
              <Button
                color="primary"
                variant="filled"
                label="GO"
                className="w-16 rounded-l-none h-full border border-primary-500"
                disabled={isSubmitting}
                onPress={handleJoin}
              />
            </View>
            {errors.code && (
              <Text className="text-xs text-destructive-500">
                {errors.code.message}
              </Text>
            )}
          </View>

          <View className="flex flex-row items-center justify-center gap-2 w-full">
            <View className="flex-1  h-px bg-foreground" />
            <Text>OU</Text>
            <View className="flex-1 h-px bg-foreground" />
          </View>

          <View className="h-[45%] flex w-full justify-start items-center gap-4">
            <Text className="text-2xl">Créer</Text>
            <View className="flex flex-col w-full items-center gap-4">
              <Button
                color="primary"
                variant="filled"
                label="SOLO"
                size="large"
                onPress={handleSoloPlay}
              />
              <Button
                color="primary"
                variant="filled"
                label="MULTI"
                size="large"
                onPress={handleMultiPlay}
              />
            </View>
          </View>
        </View>

        <Dialog
          visible={openConnectionAlert}
          onClose={() => setOpenConnectionAlert(false)}
          className="h-auto"
        >
          <View className="p-5">
            <Text className="text-center text-xl mb-6">
              Vous devez être connecté pour jouer en mode multi !
            </Text>
            <View className="flex flex-col gap-4 items-center justify-center w-min-full">
              <Button
                label="CONNEXION"
                size="medium"
                variant="outlined"
                onPress={() => {
                  setOpenConnectionAlert(false);
                  router.navigate('/auth/sign-in');
                }}
              />
              <Button
                label="INSCRIPTION"
                size="medium"
                variant="filled"
                onPress={() => {
                  setOpenConnectionAlert(false);
                  router.navigate('/auth/sign-up');
                }}
              />
            </View>
          </View>
        </Dialog>
      </View>
    </TouchableWithoutFeedback>
  );
}
