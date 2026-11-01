import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type ListRenderItemInfo } from 'react-native';
import ReorderableList, { type ReorderableListReorderEvent } from 'react-native-reorderable-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { ColorPickerModal } from '../components/ColorPickerModal';
import { PlayerRow } from '../components/PlayerRow';
import { SegmentedControl, type Segment } from '../components/SegmentedControl';
import { Stepper } from '../components/Stepper';
import { useGame } from '../state/GameContext';
import { MAX_PLAYERS, MIN_PLAYERS, displayName } from '../state/gameReducer';
import type { Player, WinCondition } from '../state/types';
import { useTheme } from '../theme';
import { confirmAction } from '../utils/confirm';

const WIN_CONDITIONS: Segment<WinCondition>[] = [
  { value: 'highest', label: 'Più punti', icon: 'arrow-up' },
  { value: 'lowest', label: 'Meno punti', icon: 'arrow-down' },
];

export default function PlayersScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, actions, isHydrated } = useGame();
  const { players } = state;
  // The target is kept after closing so the picker content stays stable while it fades out.
  const [colorTargetId, setColorTargetId] = useState<string | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const colorTargetIndex = players.findIndex((player) => player.id === colorTargetId);
  const colorTarget = colorTargetIndex === -1 ? null : players[colorTargetIndex];
  const canRemove = players.length > MIN_PLAYERS;

  const removePlayer = useCallback(
    async (id: string) => {
      const index = players.findIndex((player) => player.id === id);
      const player = players[index];
      if (!player) return;
      if (player.score !== 0) {
        const confirmed = await confirmAction({
          title: 'Rimuovere il giocatore?',
          message: `${displayName(player, index)} ha ${player.score} punti: verranno persi.`,
          confirmText: 'Rimuovi',
          destructive: true,
        });
        if (!confirmed) return;
      }
      actions.removePlayer(id);
    },
    [players, actions],
  );

  const openColorPicker = useCallback((id: string) => {
    setColorTargetId(id);
    setIsColorPickerOpen(true);
  }, []);

  const handleReorder = useCallback(
    ({ from, to }: ReorderableListReorderEvent) => actions.movePlayer(from, to),
    [actions],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Player>) => (
      <PlayerRow
        player={item}
        index={index}
        canRemove={canRemove}
        onRename={actions.renamePlayer}
        onPickColor={openColorPicker}
        onRemove={removePlayer}
      />
    ),
    [canRemove, actions, removePlayer, openColorPicker],
  );

  if (!isHydrated) {
    return <ActivityIndicator style={styles.loading} color={theme.primary} />;
  }

  return (
    <View style={styles.screen}>
      <ReorderableList
        data={players}
        keyExtractor={(player) => player.id}
        renderItem={renderItem}
        onReorder={handleReorder}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Stepper
              label="Numero giocatori"
              value={players.length}
              min={MIN_PLAYERS}
              max={MAX_PLAYERS}
              onIncrement={actions.addPlayer}
              onDecrement={() => {
                const last = players[players.length - 1];
                if (last) void removePlayer(last.id);
              }}
            />
            <View style={[styles.setting, { backgroundColor: theme.surface }]}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Vince chi ha</Text>
              <SegmentedControl
                segments={WIN_CONDITIONS}
                value={state.winCondition}
                onChange={actions.setWinCondition}
                accessibilityLabel="Regola di vittoria"
              />
            </View>
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              L&apos;ordine della lista è l&apos;ordine di turno. Trascina la maniglia ≡ per
              spostare un giocatore, tocca il cerchio per cambiarne il colore.
            </Text>
          </View>
        }
        ListFooterComponent={
          players.length > 1 ? (
            <Button
              label="Ordine casuale"
              icon="shuffle"
              variant="secondary"
              onPress={actions.shufflePlayers}
              style={styles.shuffle}
            />
          ) : undefined
        }
      />

      <ColorPickerModal
        visible={isColorPickerOpen && colorTarget !== null}
        playerName={colorTarget ? displayName(colorTarget, colorTargetIndex) : ''}
        initialColor={colorTarget?.color ?? '#000000'}
        usedColors={players
          .filter((player) => player.id !== colorTargetId)
          .map((player) => player.color)}
        onCancel={() => setIsColorPickerOpen(false)}
        onConfirm={(color) => {
          if (colorTargetId) actions.setPlayerColor(colorTargetId, color);
          setIsColorPickerOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1 },
  content: { padding: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  header: { gap: 12, marginBottom: 16 },
  hint: { fontSize: 14, lineHeight: 20, paddingHorizontal: 4 },
  setting: { borderRadius: 14, padding: 12, paddingTop: 10, gap: 10 },
  settingLabel: { fontSize: 17, fontWeight: '600', paddingHorizontal: 4 },
  shuffle: { marginTop: 8 },
});
