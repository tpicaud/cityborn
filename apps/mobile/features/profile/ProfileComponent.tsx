import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { View, Text } from '@/components/ui/native/NativeComponents';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@cityborn/contexts';
import { GameRecord } from '@cityborn/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

export default function ProfileComponent() {
  const { user } = useAuth();
  const router = useRouter();
  const [gamesRecords, setGamesRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchGameRecords();
  }, []);

  const fetchGameRecords = async () => {
    if (!user) return;
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
          <View className="flex-1">
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
                {user.birthdate && (
                  <View className="flex flex-col justify-center items-center bg-transparent">
                    <Text className="font-bold text-foreground-on-primary">
                      Date de naissance
                    </Text>
                    <Text className="text-foreground-on-primary">
                      {new Date(user.birthdate).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}
                <View className="flex flex-col justify-center items-center bg-transparent">
                  <Text className="font-bold text-foreground-on-primary">
                    Status
                  </Text>
                  <Text className="text-foreground-on-primary">
                    {user.isVerified
                      ? '✅ Email vérifié'
                      : '❌ Email à vérifier'}
                  </Text>
                </View>
              </View>
            </Card>
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
                      <Text>{record.id}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
