import { useError } from '@cityborn/contexts';
import { colors } from '@cityborn/design-system';
import type {
  Category,
  GameConfig,
  OnlinePlayer,
  Session,
} from '@cityborn/api';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Dialog from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { apiClient } from '@/lib/apiClient';

interface MultiLobbyProps {
  localPlayerID: string | undefined;
  session: Session;
  isHost: boolean;
  handleUpdateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  handleStartGame: () => Promise<void>;
  handleUpdateHost: (newHostID: string) => Promise<void>;
  handleKickPlayer: (playerToKick: string) => Promise<void>;
  handleJoinSession: (playerID: string) => Promise<void>;
}

export function MultiLobby({
  localPlayerID,
  session,
  isHost,
  handleUpdateGameConfig,
  handleUpdateHost,
  handleKickPlayer,
  handleStartGame,
  handleJoinSession,
}: MultiLobbyProps) {
  const { invokeError } = useError();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [currentPseudoInput, setCurrentPseudoInput] = useState<string>('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await apiClient.fetchCategories();
        setCategories(categories);
      } catch {
        invokeError('Aucunes catégories trouvées');
      }
    };
    fetchCategories();
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(session.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="flex-1 justify-center items-center">
      <View className="flex-1 flex items-center justify-center gap-10 w-70">
        <Text className="text-2xl  font-bold">MULTI</Text>

        {/* Join code */}
        <View className="flex flex-col gap-1 justify-center items-center">
          <Text className="text-xl">Code</Text>
          <View className="flex flex-row items-center justify-center gap-2 h-14 bg-background w-auto rounded-xl py-1 px-5 border">
            <Text className="text-xl text-center">{session.id}</Text>
            {copied ? (
              <Text className="text-green-600">Copié !</Text>
            ) : (
              <Pressable onPress={handleCopy}>
                <Icon
                  size={20}
                  name="clipboard_fill"
                  color={colors.primary[500]}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Players */}
        <View className="flex flex-col gap-2 w-full">
          <Text className="text-xl">Joueurs</Text>
          <View className=" w-full h-[1px] bg-foreground mt-[-6] mb-1"></View>
          <ScrollView className="max-h-30">
            <View className="flex-row flex-wrap justify-between gap-2 w-full">
              {(session.players.every((p) => 'connected' in p)
                ? (session.players as OnlinePlayer[]).sort((a, b) =>
                    a.connected === b.connected ? 0 : a.connected ? -1 : 1,
                  )
                : session.players
              ).map((player) => (
                <View
                  key={player.username}
                  className={`w-6/13 flex-row items-center gap-2 h-7 ${!(player as OnlinePlayer).connected && 'opacity-30'}`}
                >
                  <View className="w-[3px] h-full bg-foreground/30 rounded-full" />
                  <Text className="text-xl">{player.username}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Catégories */}
        <View className="flex flex-col gap-2 w-full">
          <Text className="text-xl">Catégories</Text>
          <View className=" w-full h-[1px] bg-foreground mt-[-6] mb-1"></View>
          {categories.length === 0 ? (
            <Text>Aucune catégorie disponible</Text>
          ) : (
            <View className="flex flex-wrap flex-row gap-2">
              {/* All categories chip */}
              <Pressable onPress={() => setSelectedCategories([])} key={'all'}>
                <Card
                  variant="outline"
                  className={`rounded-2xl border-2 border-primary w-34 flex items-center justify-center
                      ${
                        selectedCategories.length === 0
                          ? 'opacity-100'
                          : 'opacity-40'
                      }`}
                >
                  <Text className="text-center font-bold">Toutes</Text>
                </Card>
              </Pressable>

              {/* Categories chips */}
              {categories.map((cat) => {
                return (
                  <Pressable
                    onPress={() => toggleCategory(cat.id)}
                    key={cat.id}
                  >
                    <Card
                      variant="outline"
                      className={`rounded-2xl border-2 border-primary w-34 flex items-center justify-center
                      ${
                        selectedCategories.includes(cat.id)
                          ? 'opacity-100'
                          : 'opacity-40'
                      }`}
                    >
                      <Text className="text-center font-bold">{cat.name}</Text>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <Button
          size="large"
          label="JOUER"
          disabled={!isHost}
          onPress={async () => {
            await handleUpdateGameConfig({
              ...session.gameConfig,
              categories: categories.filter((cat) =>
                selectedCategories.includes(cat.id),
              ),
            });
            await handleStartGame();
          }}
        />
      </View>
      <Dialog visible={!localPlayerID} className="h-auto">
        <View className="flex items-center justify-center">
          <Text className="text-center text-xl mb-4">
            Comment tu t'appelles ?
          </Text>
          <TextInput
            value={currentPseudoInput}
            onChangeText={(text) => setCurrentPseudoInput(text)}
            className="mb-3"
          />
          <Button
            label="Jouer"
            size="medium"
            disabled={!currentPseudoInput}
            onPress={() => handleJoinSession(currentPseudoInput)}
          />
        </View>
      </Dialog>
    </View>
  );
}
