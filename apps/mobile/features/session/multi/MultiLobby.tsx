import type {
  GameConfig,
  OnlinePlayer,
  PlayerId,
  Session,
} from '@cityborn/api';
import {
  useCategorySelection,
  useCategoryTrees,
} from '@cityborn/client/session';
import { colors } from '@cityborn/design-system';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { fetchCategoryTrees } from '@/lib/api/category';

interface MultiLobbyProps {
  localPlayerID: PlayerId | undefined;
  session: Session;
  isHost: boolean;
  handleUpdateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  handleStartGame: () => Promise<void>;
  handleJoinSession: (playerID: string) => Promise<void>;
}

export function MultiLobby({
  localPlayerID,
  session,
  isHost,
  handleUpdateGameConfig,
  handleStartGame,
  handleJoinSession,
}: MultiLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [currentPseudoInput, setCurrentPseudoInput] = useState<string>('');
  const categoryTrees = useCategoryTrees(fetchCategoryTrees);
  const {
    selectedPath,
    currentNodes,
    currentName,
    openCategory,
    goBack,
    playCategory,
  } = useCategorySelection({
    categoryTrees,
    session,
    isHost,
    updateGameConfig: handleUpdateGameConfig,
    startGame: handleStartGame,
  });

  const handleCopy = async () => {
    await Clipboard.setStringAsync(session.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="flex-1 justify-center items-center">
      <View className="flex-1 flex items-center justify-center gap-10 w-[88%] max-w-96">
        <Text className="text-2xl  font-bold">MULTI</Text>

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

        <View className="flex flex-col gap-2 w-full">
          <Text className="text-xl">Joueurs</Text>
          <View className=" w-full h-[1px] bg-foreground mt-[-6] mb-1"></View>
          <ScrollView className="max-h-40">
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

        <View className="flex flex-col gap-2 w-full">
          <View className="flex-row items-center gap-1">
            {selectedPath.length > 0 && (
              <Pressable onPress={goBack}>
                <Icon
                  name="chevron_back_outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </Pressable>
            )}
            <Text className="text-xl">{currentName ?? 'Packs'}</Text>
          </View>
          <View className="w-full h-[1px] bg-foreground mt-[-6] mb-1"></View>
          {currentNodes.length === 0 ? (
            <Text>Aucun pack disponible</Text>
          ) : (
            <ScrollView className="max-h-80">
              <View className="flex flex-col gap-2 w-full">
                {currentNodes.map((node) => (
                  <View
                    key={node.id}
                    className="flex-row items-center justify-between gap-3 py-2 border-b border-foreground/10"
                  >
                    <Text className="flex-1 text-lg font-semibold">
                      {node.name}
                    </Text>
                    <View className="flex-col gap-1">
                      <Button
                        size="small"
                        label="Jouer"
                        disabled={!isHost}
                        onPress={() => playCategory(node)}
                        className="w-24 h-9 px-0"
                      />
                      {node.children.length > 0 && (
                        <Button
                          variant="outlined"
                          size="small"
                          label="Sous-packs"
                          onPress={() => openCategory(node)}
                          className="w-24 h-9 px-0"
                        />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
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
