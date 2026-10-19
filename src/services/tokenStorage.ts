import { Platform } from 'react-native';

const TOKEN_KEY = 'ridex_access_token';

export async function getAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    return AsyncStorage.getItem(TOKEN_KEY);
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveAccessToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  if (Platform.OS === 'web') {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
