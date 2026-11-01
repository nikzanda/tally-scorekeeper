import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import { clampChannel, hexToRgb, normalizeHex, rgbToHex, type Rgb } from '../utils/color';
import { DraftTextInput } from './DraftTextInput';

type Props = {
  color: string;
  onChange: (color: string) => void;
};

const CHANNELS: { key: keyof Rgb; label: string; tint: string; name: string }[] = [
  { key: 'r', label: 'R', tint: '#E53935', name: 'Rosso' },
  { key: 'g', label: 'G', tint: '#43A047', name: 'Verde' },
  { key: 'b', label: 'B', tint: '#1E88E5', name: 'Blu' },
];

const digitsOnly = (text: string) => text.replace(/\D/g, '').slice(0, 3);

const parseChannel = (text: string): number | null => {
  if (text === '') return null;
  const value = Number(text);
  return value >= 0 && value <= 255 ? value : null;
};

const parseFullHex = (text: string): string | null =>
  /^#?[0-9a-f]{6}$/i.test(text.trim()) ? normalizeHex(text) : null;

export function RgbSliders({ color, onChange }: Props) {
  const theme = useTheme();
  const rgb = hexToRgb(color);
  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.surfaceMuted, borderColor: theme.border },
  ];

  const setChannel = (key: keyof Rgb, value: number) =>
    onChange(rgbToHex({ ...rgb, [key]: clampChannel(value) }));

  return (
    <View style={styles.container}>
      {CHANNELS.map(({ key, label, tint, name }) => (
        <View key={key} style={styles.row}>
          <Text style={[styles.channelLabel, { color: tint }]}>{label}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={255}
            step={1}
            value={rgb[key]}
            onValueChange={(value) => setChannel(key, value)}
            minimumTrackTintColor={tint}
            maximumTrackTintColor={theme.border}
            thumbTintColor={tint}
            accessibilityLabel={`Componente ${name}`}
          />
          <DraftTextInput
            style={[inputStyle, styles.channelInput]}
            value={String(rgb[key])}
            parse={parseChannel}
            sanitize={digitsOnly}
            onValueChange={(value) => setChannel(key, value)}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
            accessibilityLabel={`Valore ${name}, da 0 a 255`}
          />
        </View>
      ))}
      <View style={styles.row}>
        <Text style={[styles.hexLabel, { color: theme.textMuted }]}>HEX</Text>
        <DraftTextInput
          style={[inputStyle, styles.hexInput]}
          value={color}
          parse={parseFullHex}
          onValueChange={onChange}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          selectTextOnFocus
          accessibilityLabel="Codice colore esadecimale"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  channelLabel: { width: 18, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  slider: { flex: 1, height: 40 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  channelInput: { width: 60, textAlign: 'center' },
  hexLabel: { width: 40, fontSize: 14, fontWeight: '700' },
  hexInput: { flex: 1, letterSpacing: 1 },
});
