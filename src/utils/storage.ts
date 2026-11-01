import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'tally-scorekeeper';

export type StorageName = 'game' | 'history' | 'theme';

export function readItem(name: StorageName): Promise<string | null> {
  return AsyncStorage.getItem(`${PREFIX}:${name}`);
}

export function writeItem(name: StorageName, value: string): Promise<void> {
  return AsyncStorage.setItem(`${PREFIX}:${name}`, value);
}
