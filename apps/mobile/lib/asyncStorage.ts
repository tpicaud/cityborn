import type { KeyValueStorage } from '@cityborn/client/ports';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const asyncStorage: KeyValueStorage = {
  async get(key) {
    try {
      const json = await AsyncStorage.getItem(key);
      return json ? (JSON.parse(json) as string) : null;
    } catch (error) {
      console.error(`AsyncStorage get error for key "${key}":`, error);
      return null;
    }
  },

  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`AsyncStorage set error for key "${key}":`, error);
    }
  },
};
