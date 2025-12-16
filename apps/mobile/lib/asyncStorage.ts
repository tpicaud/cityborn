import AsyncStorage from '@react-native-async-storage/async-storage';

type StoredKeys = 'visitor_id';

export const asyncStorage = {
  async set<T>(key: StoredKeys, value: T): Promise<void> {
    try {
      const json = JSON.stringify(value);
      await AsyncStorage.setItem(key, json);
    } catch (e) {
      console.error(`AsyncStorage set error for key "${key}":`, e);
    }
  },

  async get<T>(key: StoredKeys): Promise<T | null> {
    try {
      const json = await AsyncStorage.getItem(key);
      return json ? (JSON.parse(json) as T) : null;
    } catch (e) {
      console.error(`AsyncStorage get error for key "${key}":`, e);
      return null;
    }
  },

  async remove(key: StoredKeys): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`AsyncStorage remove error for key "${key}":`, e);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('AsyncStorage clear error:', e);
    }
  },
};
