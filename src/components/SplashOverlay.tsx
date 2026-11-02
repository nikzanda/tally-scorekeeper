import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/** Must match the `expo-splash-screen` background in app.json, so the native splash hands over seamlessly. */
const SPLASH_BACKGROUND = '#024947';
/** Keeps the artwork on screen long enough to be seen, even when loading is instant. */
const MIN_VISIBLE_MS = 1000;
const FADE_IN_MS = 250;
const FADE_OUT_MS = 400;

type Props = {
  /** True once the saved data the first screen depends on has been loaded. */
  isReady: boolean;
};

/**
 * Full-screen launch artwork shown on top of the app while it loads.
 * The native splash can only show a centered icon on Android 12+, so it shows the background color
 * alone and this overlay takes over with the full image.
 */
export function SplashOverlay({ isReady }: Props) {
  const [hasMinElapsed, setHasMinElapsed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setHasMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timeout);
  }, []);

  if (isReady && hasMinElapsed) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(FADE_OUT_MS)}
      // Same color as the native splash, so hiding it once the overlay is laid out is not noticeable.
      onLayout={() => SplashScreen.hide()}
      style={[StyleSheet.absoluteFill, styles.root]}
    >
      <StatusBar style="light" />
      <Animated.Image
        entering={FadeIn.duration(FADE_IN_MS)}
        source={require('../../assets/splash-screen.jpg')}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, styles.image]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: SPLASH_BACKGROUND },
  // A required asset defaults to its intrinsic size, which would win over the absolute insets.
  image: { width: '100%', height: '100%' },
});
