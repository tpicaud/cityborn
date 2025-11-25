import { View, Text } from '@/components/ui/native/NativeComponents';
import { GuessObject } from '@cityborn/types';

export default function GuessObjectCard({
  guessObject,
}: Readonly<{ guessObject: GuessObject }>) {
  return (
    <View>
      <Text>{guessObject.name}</Text>
    </View>
  );
}
