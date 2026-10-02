import type { KeyValueStorage } from '@cityborn/client/platform';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const keyValueStorage: KeyValueStorage = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key),
};
