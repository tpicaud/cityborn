import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Dialog from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { View, Text } from '@/components/ui/native/NativeComponents';
import { apiClient } from '@/lib/apiClient';
import { useAuth, useError } from '@cityborn/contexts';
import { colors } from '@cityborn/design-system';
import { GameRecord } from '@cityborn/types';
import { calculateTotalPoints, isoToLocalDate } from '@cityborn/utils';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { invokeError } = useError();
  const router = useRouter();
  const [gamesRecords, setGamesRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] =
    useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchGameRecords();
      }
    }, []),
  );

  const fetchGameRecords = async () => {
    if (!user) return;
    console.log('Fetching game records for user:', user);
    try {
      setLoading(true);
      const gameRecords = await apiClient.getGameRecords();
      setGamesRecords(gameRecords);
    } catch (error) {
      console.error('Failed to fetch game records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await apiClient.deleteUser();
      await apiClient.signOut();
      setUser(null);
      setDeleteAccountModalOpen(false);
      router.replace('/');
    } catch (error: any) {
      invokeError(error);
    }
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
            <Text className="text-5xl font-bold text-center py-15 pb-8">
              {user.username}
            </Text>
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
                </View>
              </View>
            </Card>
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
              ) : gamesRecords.length === 0 ? (
                <Text className="text-center mt-2 text-neutral-600 italic">
                    Aucunes parties trouvées.
                </Text>
              ) : (
                <ScrollView
                  className="flex-1 p-2"
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                  {gamesRecords.map((record) => (
                    <View
                      key={record.id}
                      className="flex flex-row justify-between items-center p-4 border border-b rounded-xl mb-2"
                    >
                      <View className="flex flex-col justify-between items-start">
                        <Text>{record.mode}</Text>
                        <Text>{isoToLocalDate(record.createdAt)}</Text>
                      </View>
                      <View className="flex flex-col justify-between items-center">
                        <Text className="font-bold">
                          {calculateTotalPoints(record.results[user.username])}
                        </Text>
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
        visible={deleteAccountModalOpen}
        onClose={() => setDeleteAccountModalOpen(false)}
        className="h-auto"
      >
        <View className="flex justify-center items-center gap-4">
          <View className="flex justify-center items-center gap-4">
            <Icon name="alert_fill" size={40} color={colors.destructive[500]} />
            <Text className="text-lg text-center">
              Voux-tu vraiment supprimer ton compte ?
            </Text>
          </View>
          <View className="flex flex- gap-2">
            <Button
              variant="outlined"
              color="destructive"
              label="Annuler"
              onPress={() => setDeleteAccountModalOpen(false)}
            />
            <Button
              variant="filled"
              color="destructive"
              label="Supprimer"
              onPress={async () => await handleDeleteAccount()}
            />
          </View>
        </View>
      </Dialog>
    </View>
  );
}
