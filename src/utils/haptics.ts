import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light tick for frequent interactions such as score taps. */
export function selectionFeedback(): void {
  if (isSupported) Haptics.selectionAsync().catch(() => {});
}

/** Stronger feedback for meaningful events such as a turn change. */
export function impactFeedback(): void {
  if (isSupported) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
