import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { SegmentedControl, type Segment } from './SegmentedControl';

type Mode = 'add' | 'subtract';

type Props = {
  visible: boolean;
  playerName: string;
  score: number;
  onCancel: () => void;
  onSubmit: (delta: number) => void;
};

const MAX_DIGITS = 6;
const QUICK_AMOUNTS = [5, 10, 20, 50, 100];
const KEY_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'backspace'],
] as const;
type Key = (typeof KEY_ROWS)[number][number];

export function ScoreEntryModal({ visible, playerName, score, onCancel, onSubmit }: Props) {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('add');
  const [digits, setDigits] = useState('');

  useEffect(() => {
    if (!visible) return;
    setMode('add');
    setDigits('');
  }, [visible]);

  const amount = Number(digits || '0');
  const delta = mode === 'add' ? amount : -amount;
  const accent = mode === 'add' ? theme.success : theme.danger;

  const pressKey = (key: Key) => {
    if (key === 'clear') setDigits('');
    else if (key === 'backspace') setDigits((current) => current.slice(0, -1));
    else setDigits((current) => (current + key).replace(/^0+/, '').slice(0, MAX_DIGITS));
  };

  const modes: Segment<Mode>[] = [
    { value: 'add', label: 'Aggiungi', icon: 'add', color: theme.success },
    { value: 'subtract', label: 'Togli', icon: 'remove', color: theme.danger },
  ];

  return (
    <BottomSheet visible={visible} title={playerName} onClose={onCancel}>
      <SegmentedControl segments={modes} value={mode} onChange={setMode} />

      <View style={styles.display} accessibilityLiveRegion="polite">
        <Text style={[styles.amount, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
          {mode === 'add' ? '+' : '−'}
          {amount}
        </Text>
        <Text style={[styles.preview, { color: theme.textMuted }]}>
          {score} → {score + delta}
        </Text>
      </View>

      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map((value) => (
          <Pressable
            key={value}
            onPress={() => setDigits(String(value))}
            accessibilityRole="button"
            accessibilityLabel={`Imposta ${value} punti`}
            style={({ pressed }) => [
              styles.quick,
              { borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.quickLabel, { color: theme.text }]}>{value}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.keypad}>
        {KEY_ROWS.map((row) => (
          <View key={row.join('')} style={styles.keyRow}>
            {row.map((key) => (
              <Pressable
                key={key}
                onPress={() => pressKey(key)}
                accessibilityRole="button"
                accessibilityLabel={
                  key === 'clear' ? 'Cancella tutto' : key === 'backspace' ? 'Cancella' : key
                }
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: theme.surfaceMuted },
                  pressed && styles.pressed,
                ]}
              >
                {key === 'backspace' ? (
                  <Ionicons name="backspace-outline" size={26} color={theme.text} />
                ) : key === 'clear' ? (
                  <Text style={[styles.keyLabelSmall, { color: theme.text }]}>C</Text>
                ) : (
                  <Text style={[styles.keyLabel, { color: theme.text }]}>{key}</Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Annulla" variant="secondary" onPress={onCancel} style={styles.cancel} />
        <Button
          label={mode === 'add' ? `Aggiungi ${amount}` : `Togli ${amount}`}
          color={accent}
          disabled={amount === 0}
          onPress={() => onSubmit(delta)}
          style={styles.submit}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  display: { alignItems: 'center' },
  amount: { fontSize: 52, fontWeight: '800', fontVariant: ['tabular-nums'] },
  preview: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  quickRow: { flexDirection: 'row', gap: 8 },
  quick: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickLabel: { fontSize: 16, fontWeight: '700' },
  keypad: { gap: 8 },
  keyRow: { flexDirection: 'row', gap: 8 },
  key: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: { fontSize: 24, fontWeight: '600' },
  keyLabelSmall: { fontSize: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12 },
  cancel: { flex: 1 },
  submit: { flex: 2 },
  pressed: { opacity: 0.6 },
});
