import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import { PALETTE, getReadableTextColor } from '../utils/color';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { RgbSliders } from './RgbSliders';
import { SegmentedControl, type Segment } from './SegmentedControl';

type Mode = 'palette' | 'rgb';

type Props = {
  visible: boolean;
  playerName: string;
  initialColor: string;
  /** Colors already assigned to the other players. */
  usedColors: string[];
  onCancel: () => void;
  onConfirm: (color: string) => void;
};

const MODES: Segment<Mode>[] = [
  { value: 'palette', label: 'Palette' },
  { value: 'rgb', label: 'RGB' },
];

export function ColorPickerModal({
  visible,
  playerName,
  initialColor,
  usedColors,
  onCancel,
  onConfirm,
}: Props) {
  const theme = useTheme();
  const [draft, setDraft] = useState(initialColor);
  const [mode, setMode] = useState<Mode>('palette');

  // Start from the player's current color every time the picker opens.
  useEffect(() => {
    if (!visible) return;
    setDraft(initialColor);
    setMode(PALETTE.includes(initialColor) ? 'palette' : 'rgb');
  }, [visible, initialColor]);

  const used = new Set(usedColors);
  const previewText = getReadableTextColor(draft);

  return (
    <BottomSheet visible={visible} title="Colore giocatore" onClose={onCancel}>
      <View style={[styles.preview, { backgroundColor: draft }]}>
        <Text style={[styles.previewName, { color: previewText }]} numberOfLines={1}>
          {playerName}
        </Text>
        <Text style={[styles.previewHex, { color: previewText }]}>{draft}</Text>
      </View>

      <SegmentedControl segments={MODES} value={mode} onChange={setMode} />

      <View style={styles.body}>
        {mode === 'palette' ? (
          <>
            <View style={styles.grid}>
              {PALETTE.map((color) => {
                const selected = color === draft;
                return (
                  <Pressable
                    key={color}
                    onPress={() => setDraft(color)}
                    accessibilityRole="button"
                    accessibilityLabel={`Colore ${color}${used.has(color) ? ', già in uso' : ''}`}
                    accessibilityState={{ selected }}
                    style={[
                      styles.swatch,
                      { backgroundColor: color, borderColor: theme.border },
                      selected && [styles.swatchSelected, { borderColor: theme.text }],
                    ]}
                  >
                    {selected && (
                      <Ionicons name="checkmark" size={24} color={getReadableTextColor(color)} />
                    )}
                    {used.has(color) && !selected && (
                      <View
                        style={[
                          styles.usedDot,
                          { backgroundColor: getReadableTextColor(color), borderColor: color },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
            {usedColors.some((color) => PALETTE.includes(color)) && (
              <Text style={[styles.hint, { color: theme.textMuted }]}>
                Il pallino indica un colore già scelto da un altro giocatore.
              </Text>
            )}
          </>
        ) : (
          <RgbSliders color={draft} onChange={setDraft} />
        )}
      </View>

      <View style={styles.actions}>
        <Button label="Annulla" variant="secondary" onPress={onCancel} style={styles.action} />
        <Button label="Conferma" onPress={() => onConfirm(draft)} style={styles.action} />
      </View>
    </BottomSheet>
  );
}

const SWATCH_SIZE = 44;

const styles = StyleSheet.create({
  preview: {
    height: 76,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  previewName: { flex: 1, fontSize: 20, fontWeight: '700' },
  previewHex: { fontSize: 15, fontWeight: '600', letterSpacing: 1, fontVariant: ['tabular-nums'] },
  body: { minHeight: 236, justifyContent: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: SWATCH_SIZE * 5 + 12 * 4,
    alignSelf: 'center',
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { borderWidth: 3 },
  usedDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  hint: { marginTop: 12, fontSize: 13, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
});
