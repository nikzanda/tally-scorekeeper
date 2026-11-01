import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useReorderableDrag } from 'react-native-reorderable-list';

import { MAX_NAME_LENGTH, defaultPlayerName } from '../state/gameReducer';
import type { Player } from '../state/types';
import { useTheme } from '../theme';
import { getReadableTextColor } from '../utils/color';
import { IconButton } from './IconButton';

type Props = {
  player: Player;
  index: number;
  canRemove: boolean;
  onRename: (id: string, name: string) => void;
  onPickColor: (id: string) => void;
  onRemove: (id: string) => void;
};

export const PlayerRow = memo(function PlayerRow({
  player,
  index,
  canRemove,
  onRename,
  onPickColor,
  onRemove,
}: Props) {
  const theme = useTheme();
  const drag = useReorderableDrag();
  const fallbackName = defaultPlayerName(index + 1);

  return (
    <View style={[styles.row, { backgroundColor: theme.surface }]}>
      <Pressable
        onPressIn={drag}
        hitSlop={8}
        style={styles.handle}
        accessibilityRole="button"
        accessibilityLabel={`Trascina per spostare ${player.name || fallbackName}`}
        accessibilityHint="Tieni premuto e trascina per cambiare l'ordine di turno"
      >
        <Ionicons name="reorder-three" size={28} color={theme.textMuted} />
      </Pressable>

      <Text style={[styles.position, { color: theme.textMuted }]}>{index + 1}</Text>

      <Pressable
        onPress={() => onPickColor(player.id)}
        style={[styles.colorButton, { backgroundColor: player.color, borderColor: theme.border }]}
        accessibilityRole="button"
        accessibilityLabel={`Colore di ${player.name || fallbackName}: ${player.color}. Tocca per cambiarlo`}
      >
        <Ionicons name="color-palette" size={18} color={getReadableTextColor(player.color)} />
      </Pressable>

      <TextInput
        value={player.name}
        onChangeText={(name) => onRename(player.id, name)}
        onBlur={() => {
          const trimmed = player.name.trim();
          onRename(player.id, trimmed || fallbackName);
        }}
        placeholder={fallbackName}
        placeholderTextColor={theme.textMuted}
        maxLength={MAX_NAME_LENGTH}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        style={[styles.nameInput, { color: theme.text, backgroundColor: theme.surfaceMuted }]}
        accessibilityLabel={`Nome del giocatore ${index + 1}`}
      />

      <IconButton
        icon="trash-outline"
        color={theme.danger}
        size={20}
        disabled={!canRemove}
        onPress={() => onRemove(player.id)}
        accessibilityLabel={`Rimuovi ${player.name || fallbackName}`}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 8,
    paddingLeft: 4,
    paddingRight: 4,
    marginBottom: 8,
  },
  handle: { paddingHorizontal: 6, paddingVertical: 8 },
  position: { width: 20, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    fontWeight: '600',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
