/// <reference types="jest" />

import AsyncStorage from '@react-native-async-storage/async-storage';

import { readItem, writeItem } from '../storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(() => AsyncStorage.clear());

describe('storage', () => {
  it('writes and reads under the current app name', async () => {
    await writeItem('game', 'current');
    expect(await AsyncStorage.getItem('tally-scorekeeper:game')).toBe('current');
    expect(await readItem('game')).toBe('current');
  });

  it('returns null when nothing was saved', async () => {
    expect(await readItem('theme')).toBeNull();
  });
});
