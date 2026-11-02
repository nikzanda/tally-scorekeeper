import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SplashOverlay } from '../components/SplashOverlay';
import { GameProvider, useGame } from '../state/GameContext';
import { HistoryProvider, useHistory } from '../state/HistoryContext';
import { ThemeProvider, useTheme, useThemeHydrated } from '../theme';

// Called at module scope so it runs before the native splash would hide on its own;
// SplashOverlay hides it once it is on screen.
void SplashScreen.preventAutoHideAsync();

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
  const isThemeHydrated = useThemeHydrated();
  const { isHydrated: isGameHydrated } = useGame();
  const { isHydrated: isHistoryHydrated } = useHistory();

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
      <SplashOverlay isReady={isThemeHydrated && isGameHydrated && isHistoryHydrated} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
