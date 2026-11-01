import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = Omit<PressableProps, 'style' | 'children'> & {
  icon: IconName;
  color: string;
  accessibilityLabel: string;
  size?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  color,
  size = 22,
  backgroundColor = 'transparent',
  disabled,
  style,
  ...pressableProps
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { width: size + 20, height: size + 20, backgroundColor },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...pressableProps}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.3 },
});
