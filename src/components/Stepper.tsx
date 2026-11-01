import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import { IconButton } from './IconButton';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function Stepper({ label, value, min, max, onIncrement, onDecrement }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={styles.controls}>
        <IconButton
          icon="remove"
          color={theme.text}
          backgroundColor={theme.surfaceMuted}
          accessibilityLabel={`Diminuisci ${label.toLowerCase()}`}
          disabled={value <= min}
          onPress={onDecrement}
        />
        <Text
          style={[styles.value, { color: theme.text }]}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${label}: ${value}`}
        >
          {value}
        </Text>
        <IconButton
          icon="add"
          color={theme.text}
          backgroundColor={theme.surfaceMuted}
          accessibilityLabel={`Aumenta ${label.toLowerCase()}`}
          disabled={value >= max}
          onPress={onIncrement}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  label: { fontSize: 17, fontWeight: '600' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
