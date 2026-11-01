import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GameProvider } from '../state/GameContext';
import { HistoryProvider } from '../state/HistoryContext';
import { ThemeProvider, useTheme } from '../theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <GameProvider>
          <HistoryProvider>
            <RootNavigator />
          </HistoryProvider>
        </GameProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.primary,
          headerTitleStyle: { color: theme.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Punteggi' }} />
        <Stack.Screen name="players" options={{ title: 'Giocatori' }} />
        <Stack.Screen name="history" options={{ title: 'Storico partite' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
