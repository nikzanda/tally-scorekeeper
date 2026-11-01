import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import { getReadableTextColor } from '../utils/color';
import type { IconName } from './IconButton';

export type Segment<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
  /** Background of the segment when selected; defaults to the surface color. */
  color?: string;
};

type Props<T extends string> = {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  accessibilityLabel,
  style,
}: Props<T>) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.surfaceMuted }, style]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {segments.map((segment) => {
        const selected = segment.value === value;
        const background = segment.color ?? theme.surface;
        const foreground = !selected
          ? theme.textMuted
          : segment.color
            ? getReadableTextColor(segment.color)
            : theme.text;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && { backgroundColor: background }]}
          >
            {segment.icon && <Ionicons name={segment.icon} size={18} color={foreground} />}
            <Text style={[styles.label, { color: foreground }]} numberOfLines={1}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 15, fontWeight: '700' },
});
