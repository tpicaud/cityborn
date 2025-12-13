import { View, Text } from '@/components/ui/native/NativeComponents';
import { GuessObject } from '@cityborn/types';
import { Image } from 'expo-image';

export default function GuessObjectCard({
  guessObject,
}: Readonly<{ guessObject: GuessObject }>) {
  return (
    <View className="flex w-full min-h-40 max-h-70 min-w-25 max-w-40 rounded-xs bg-background">
      <Image
        source={guessObject.image}
        placeholder="Image"
        contentFit="cover"
        transition={500}
        style={{ minHeight: 150, maxHeight: 300 }}
      />
      <Text className="text-center p-3">{guessObject.name}</Text>
    </View>
  );
}
