import { View, Text } from '@/components/ui/native/NativeComponents';
import { apiClient } from '@/lib/apiClient';
import { useError } from '@cityborn/contexts';
import { Category, GameConfig, Session } from '@cityborn/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

interface SoloLobbyProps {
  localPlayerID: string | undefined;
  session: Session;
  isHost: boolean;
  handleUpdateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  handleStartGame: () => Promise<void>;
}

export function SoloLobbyComponent({
  localPlayerID,
  session,
  isHost,
  handleUpdateGameConfig,
  handleStartGame,
}: SoloLobbyProps) {
  const { invokeError } = useError();
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const router = useRouter();

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

  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center">
        <Text className="">SOLO</Text>
      </View>
    </View>
  );
}
