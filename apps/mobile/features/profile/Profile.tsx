import { isoToLocalDate, useError } from '@cityborn/client';
import { useAuth } from '@cityborn/client/auth';
import {
  toUpdatePassword,
  useChangePasswordForm,
  useProfile,
  useUsernameForm,
} from '@cityborn/client/profile';
import { colors } from '@cityborn/design-system';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { useCallback, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Pressable, ScrollView } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Dialog from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { authApi } from '@/lib/api/auth';
import { profileApi } from '@/lib/api/profile';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { invokeError } = useError();
  const router = useRouter();
  const { games, loading, refreshGames } = useProfile({
    profileApi,
    localUser: user ?? undefined,
  });
  const usernameForm = useUsernameForm(user?.username ?? '');
  const passwordForm = useChangePasswordForm();
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
  const [passwordUpdated, setPasswordUpdated] = useState<boolean>(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] =
    useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      refreshGames();
    }, [refreshGames]),
  );

  const submitUsername = usernameForm.handleSubmit(async (data) => {
    const result = await authApi.updateUsername(data);
    if (!result.ok) return invokeError(result.error);

    setUser(result.data);
    usernameForm.reset({ username: result.data.username });
    setIsEditingUsername(false);
  });

  const cancelUsernameEdit = (): void => {
    if (user) usernameForm.reset({ username: user.username });
    setIsEditingUsername(false);
  };

  const closePasswordModal = (): void => {
    passwordForm.reset();
    setPasswordUpdated(false);
    setPasswordModalOpen(false);
  };

  const submitPassword = passwordForm.handleSubmit(async (values) => {
    const result = await authApi.updatePassword(toUpdatePassword(values));
    if (!result.ok) return invokeError(result.error);

    setUser(result.data);
    passwordForm.reset();
    setPasswordUpdated(true);
  });

  const handleDeleteAccount = async (): Promise<void> => {
    if (!user) return;
    const result = await authApi.deleteUser();
    if (!result.ok) return invokeError(result.error);
    await authApi.signOut();
    setUser(null);
    setDeleteAccountModalOpen(false);
    router.replace('/');
  };

  return (
    <View className="flex-1">
      {!user ? (
        <View className="flex-1 flex justify-center items-center">
          <View className="flex flex-col w-full items-center justify-between gap-4 mt-10">
            <Text className="text-2xl mb-6">Tu n'es pas connecté !</Text>
            <Button
              color="primary"
              variant="outlined"
              label="CONNEXION"
              size="large"
              onPress={() => router.navigate('/auth/sign-in')}
            />
            <Button
              color="primary"
              variant="filled"
              label="INSCRIPTION"
              size="large"
              onPress={() => router.navigate('/auth/sign-up')}
            />
          </View>
        </View>
      ) : (
        <View className="flex-1 gap-8 mt-10">
          <View className="flex-1 gap-4">
            {isEditingUsername ? (
              <View className="flex-row items-center justify-center gap-2 py-10">
                <View className="relative">
                  <Controller
                    control={usernameForm.control}
                    name="username"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        placeholder="Pseudo"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="none"
                        error={!!usernameForm.formState.errors.username}
                        className="w-52"
                      />
                    )}
                  />
                  {usernameForm.formState.errors.username && (
                    <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                      {usernameForm.formState.errors.username.message}
                    </Text>
                  )}
                </View>
                <Pressable
                  accessibilityLabel="Valider le pseudo"
                  onPress={submitUsername}
                >
                  <Icon name="check_outline" size={28} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Annuler la modification du pseudo"
                  onPress={cancelUsernameEdit}
                >
                  <Icon name="close_outline" size={28} />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center justify-center gap-2 py-15 pb-8">
                <Text className="text-5xl font-bold text-center">
                  {user.username}
                </Text>
                <Pressable
                  accessibilityLabel="Modifier le pseudo"
                  onPress={() => setIsEditingUsername(true)}
                >
                  <Icon name="edit_outline" size={28} />
                </Pressable>
              </View>
            )}
            <Card>
              <View className="grid grid-cols-2 gap-6 bg-transparent">
                <View className="flex flex-col justify-center items-center bg-transparent">
                  <Text className="font-bold text-foreground-on-primary">
                    Email
                  </Text>
                  <Text className="text-foreground-on-primary">
                    {user.email}
                  </Text>
                </View>
                <View className="flex flex-col justify-center items-center bg-transparent">
                  <Text className="font-bold text-foreground-on-primary">
                    Status
                  </Text>
                  <Text
                    className={
                      user.isVerified
                        ? 'text-foreground-on-primary'
                        : 'text-destructive-500'
                    }
                  >
                    {user.isVerified ? 'Email vérifié' : 'Email non vérifié'}
                  </Text>
                </View>
              </View>
            </Card>
            {user.type === 'email' && (
              <Button
                variant="default"
                label="Modifier mon mot de passe"
                className="self-center"
                onPress={() => setPasswordModalOpen(true)}
              />
            )}
            <Button
              variant="default"
              label="Supprimer mon compte"
              className="self-center"
              onPress={() => setDeleteAccountModalOpen(true)}
            />
          </View>
          <View className="flex-1">
            <Text className="text-center text-xl font-bold mb-2">
              Historique des parties
            </Text>
            <View className="flex-1 border-t rounded-xl overflow-y-auto p-0">
              {loading ? (
                <View className="self-center">
                  <LoaderIcon />
                </View>
              ) : games.length === 0 ? (
                <Text className="text-center mt-2 text-neutral-600 italic">
                  Aucune partie trouvée.
                </Text>
              ) : (
                <ScrollView
                  className="flex-1 p-2"
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                  {games.map(({ gameRecord, localPlayerPoints }) => (
                    <View
                      key={gameRecord.id}
                      className="flex flex-row justify-between items-center p-4 border border-b rounded-xl mb-2"
                    >
                      <View className="flex flex-col justify-between items-start">
                        <Text>{gameRecord.mode}</Text>
                        <Text>{isoToLocalDate(gameRecord.createdAt)}</Text>
                      </View>
                      <View className="flex flex-col justify-between items-center">
                        <Text className="font-bold">{localPlayerPoints}</Text>
                        <Text>pts</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      )}

      <Dialog
        visible={passwordModalOpen}
        onClose={closePasswordModal}
        className="h-auto"
      >
        <View className="w-full items-center gap-5">
          <Text className="text-xl font-bold">Modifier mon mot de passe</Text>
          <View className="gap-5">
            <View className="relative">
              <Controller
                control={passwordForm.control}
                name="currentPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Mot de passe actuel"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    error={!!passwordForm.formState.errors.currentPassword}
                  />
                )}
              />
              {passwordForm.formState.errors.currentPassword && (
                <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                  {passwordForm.formState.errors.currentPassword.message}
                </Text>
              )}
            </View>
            <View className="relative">
              <Controller
                control={passwordForm.control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Nouveau mot de passe"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    error={!!passwordForm.formState.errors.newPassword}
                  />
                )}
              />
              {passwordForm.formState.errors.newPassword && (
                <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                  {passwordForm.formState.errors.newPassword.message}
                </Text>
              )}
            </View>
            <View className="relative">
              <Controller
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Confirmer le nouveau mot de passe"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    error={!!passwordForm.formState.errors.confirmPassword}
                  />
                )}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <Text className="absolute -bottom-4 left-4 text-xs text-destructive-500">
                  {passwordForm.formState.errors.confirmPassword.message}
                </Text>
              )}
            </View>
          </View>
          {passwordUpdated && (
            <Text className="text-primary-500">Mot de passe modifié.</Text>
          )}
          <View className="flex-row gap-2">
            <Button
              variant="outlined"
              label="Annuler"
              className="w-32"
              onPress={closePasswordModal}
            />
            <Button
              variant="filled"
              label="Valider"
              className="w-32"
              onPress={submitPassword}
            />
          </View>
        </View>
      </Dialog>

      <Dialog
        visible={deleteAccountModalOpen}
        onClose={() => setDeleteAccountModalOpen(false)}
        className="h-auto"
      >
        <View className="flex justify-center items-center gap-4">
          <View className="flex justify-center items-center gap-4">
            <Icon name="alert_fill" size={40} color={colors.destructive[500]} />
            <Text className="text-lg text-center">
              Veux-tu vraiment supprimer ton compte ?
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Button
              variant="outlined"
              color="destructive"
              label="Annuler"
              className="w-32"
              onPress={() => setDeleteAccountModalOpen(false)}
            />
            <Button
              variant="filled"
              color="destructive"
              label="Supprimer"
              className="w-32"
              onPress={handleDeleteAccount}
            />
          </View>
        </View>
      </Dialog>
    </View>
  );
}
