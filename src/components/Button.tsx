import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import { getReadableTextColor } from '../utils/color';
import type { IconName } from './IconButton';

type Variant = 'primary' | 'secondary';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  /** Overrides the background color of the primary variant. */
  color?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  color,
  disabled,
  accessibilityLabel,
  style,
}: Props) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const backgroundColor = isPrimary ? (color ?? theme.primary) : theme.surfaceMuted;
  const foreground = !isPrimary ? theme.text : color ? getReadableTextColor(color) : theme.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={20} color={foreground} />}
      <Text style={[styles.label, { color: foreground }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: { fontSize: 17, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
});
