import { StyleSheet, Text, View } from 'react-native';

import { displayName } from '../state/gameReducer';
import { canSaveGame } from '../state/history';
import type { GameState } from '../state/types';
import { useTheme } from '../theme';
import { formatDuration, roundsLabel } from '../utils/format';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { RankingList } from './RankingList';

type Props = {
  visible: boolean;
  game: GameState;
  /** Time used to show the game duration while the sheet is open. */
  now: number;
  onCancel: () => void;
  onSaveAndRestart: () => void;
  onRestartWithoutSaving: () => void;
};

export function EndGameSheet({
  visible,
  game,
  now,
  onCancel,
  onSaveAndRestart,
  onRestartWithoutSaving,
}: Props) {
  const theme = useTheme();
  const canSave = canSaveGame(game);
  const details = [
    roundsLabel(game.round),
    game.startedAt !== null ? formatDuration(now - game.startedAt) : null,
    game.winCondition === 'lowest' ? 'vince chi ha meno punti' : null,
  ].filter(Boolean);
  const nameIndex = new Map(game.players.map((player, index) => [player.id, index]));

  return (
    <BottomSheet visible={visible} title="Termina partita" onClose={onCancel}>
      <View style={[styles.summary, { backgroundColor: theme.surfaceMuted }]}>
        <RankingList
          players={game.players}
          winCondition={game.winCondition}
          getName={(player) => displayName(player, nameIndex.get(player.id) ?? 0)}
        />
        <Text style={[styles.details, { color: theme.textMuted }]}>{details.join(' · ')}</Text>
      </View>

      {!canSave && (
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          Nessun punto segnato: non c&apos;è niente da salvare nello storico.
        </Text>
      )}

      <View style={styles.actions}>
        <Button
          label="Salva e inizia nuova"
          icon="save-outline"
          disabled={!canSave}
          onPress={onSaveAndRestart}
        />
        <Button
          label="Nuova senza salvare"
          icon="refresh"
          variant="secondary"
          onPress={onRestartWithoutSaving}
        />
        <Button label="Annulla" variant="secondary" onPress={onCancel} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: 16, padding: 16, gap: 12 },
  details: { fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 14, textAlign: 'center' },
  actions: { gap: 10 },
});
