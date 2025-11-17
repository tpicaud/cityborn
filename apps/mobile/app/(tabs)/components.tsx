import { Text, View } from 'react-native';

import Button from '@/components/ui/Button';

export default function ComponentsScreen() {
  return (
    <View className="flex-1 bg-zinc-100">
      <View className="flex-1 flex flex-col justify-center items-center">
        <Text className="text-2xl">Components</Text>
        <View className="flex flex-col gap-4 mt-6">
          <View className="flex flex-row justify-center items-center gap-4">
            <Button variant="default" label="Default" />
          </View>

          <View className="flex flex-row gap-4">
            <View className="flex flex-col gap-4">
              <Button
                color="primary"
                variant="filled"
                label="Primary"
                onPress={async () => {
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  alert('Button Pressed!');
                }}
              />
              <Button color="primary" variant="outlined" label="Primary" />
              <Button
                color="primary"
                variant="filled"
                disabled
                label="Primary"
              />
              <Button
                color="primary"
                variant="outlined"
                disabled
                label="Primary"
              />
            </View>

            <View className="flex flex-col gap-4">
              <Button
                color="destructive"
                variant="filled"
                label="Destructive"
              />
              <Button
                color="destructive"
                variant="outlined"
                label="Destructive"
              />
              <Button
                color="destructive"
                variant="filled"
                disabled
                label="Primary"
              />
              <Button
                color="destructive"
                variant="outlined"
                disabled
                label="Primary"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
