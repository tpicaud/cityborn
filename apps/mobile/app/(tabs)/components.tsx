import { Text, View } from 'react-native';

import Button from '@/components/ui/Button';

export default function ComponentsScreen() {
  return (
    <View className="flex-1 bg-zinc-100">
      <View className="flex-1 flex flex-col justify-center items-center">
        <Text className="text-2xl">Components</Text>
        <View className="flex flex-col gap-4 mt-6">
          <Button variant="default" label="Default" />
          <Button variant="primary" label="Primary" />
          <Button variant="destructive" label="Destructive" />
          <Button variant="outlined" label="Outlined" />
        </View>
      </View>
    </View>
  );
}
