import LoaderIcon from '@/components/ui/LoaderIcon';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@cityborn/contexts';
import { GameRecord } from '@cityborn/types';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import Text from '@/components/ui/Text';
import View from '@/components/ui/View';

export default function ProfileComponent() {
  const { user } = useAuth();
  const [gamesRecords, setGamesRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    //fetchGameRecords();
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
          <Text className="place-self-center text-2xl text-center">
            Tu n'es pas connecté !
          </Text>
        </View>
      ) : (
        <View className="flex-1 gap-8">
          <View className="flex-1">
            <Text className="text-5xl font-bold text-center py-15">
              {user.username}
            </Text>
            <View className="grid grid-cols-2 gap-6">
              <View className="flex flex-col justify-center items-center">
                <Text className="font-bold">Email</Text>
                <Text>{user.email}</Text>
              </View>
              {user.birthdate && (
                <View className="flex flex-col justify-center items-center">
                  <Text className="font-bold">Date de naissance</Text>
                  <Text>
                    {new Date(user.birthdate).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              )}
              <View className="flex flex-col justify-center items-center">
                <Text className="font-bold">Status</Text>
                <Text>
                  {user.isVerified ? '✅ Email vérifié' : '❌ Email à vérifier'}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-center text-xl font-bold mb-2">
              Historique des parties
            </Text>
            <View className="flex-1 border rounded-xl overflow-y-auto p-0">
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
