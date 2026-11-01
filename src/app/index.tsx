import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { EndGameSheet } from '../components/EndGameSheet';
import { IconButton } from '../components/IconButton';
import { PlayerScoreCard, SCORE_CARD_HEIGHT } from '../components/PlayerScoreCard';
import { ScoreEntryModal } from '../components/ScoreEntryModal';
import { useGame } from '../state/GameContext';
import { createId, displayName, getCurrentPlayerIndex } from '../state/gameReducer';
import { createGameRecord } from '../state/history';
import { useHistory } from '../state/HistoryContext';
import { getLeaderIds } from '../state/ranking';
import type { GameState, Player } from '../state/types';
import { useTheme, useThemeToggle } from '../theme';
import { impactFeedback } from '../utils/haptics';

const CARD_GAP = 12;
const ITEM_HEIGHT = SCORE_CARD_HEIGHT + CARD_GAP;

export default function GameScreen() {
  const theme = useTheme();
  const toggleTheme = useThemeToggle();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, actions, isHydrated } = useGame();
  const { addRecord } = useHistory();
  const { players, round, history, winCondition } = state;
  const listRef = useRef<FlatList<Player>>(null);

  // The target is kept after closing so the sheet content stays stable while it fades out.
  const [entryTargetId, setEntryTargetId] = useState<string | null>(null);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  // Snapshot taken when "Termina" is pressed, so the summary does not change while it fades out.
  const [endGame, setEndGame] = useState<{ game: GameState; openedAt: number } | null>(null);
  const [isEndGameOpen, setIsEndGameOpen] = useState(false);

  const currentIndex = getCurrentPlayerIndex(state);
  const currentPlayer = players[currentIndex];
  const nextPlayerIndex = (currentIndex + 1) % players.length;
  const leaderIds = useMemo(() => getLeaderIds(players, winCondition), [players, winCondition]);
  const entryTargetIndex = players.findIndex((player) => player.id === entryTargetId);
  const entryTarget = entryTargetIndex === -1 ? null : players[entryTargetIndex];

  // Keep the player whose turn it is visible when the list is longer than the screen.
  useEffect(() => {
    if (!isHydrated || currentIndex < 0) return;
    listRef.current?.scrollToIndex({ index: currentIndex, viewPosition: 0.3, animated: true });
  }, [currentIndex, isHydrated]);

  const openScoreEntry = useCallback((id: string) => {
    setEntryTargetId(id);
    setIsEntryOpen(true);
  }, []);

  const openEndGame = useCallback(() => {
    setEndGame({ game: state, openedAt: Date.now() });
    setIsEndGameOpen(true);
  }, [state]);

  const saveAndRestart = useCallback(() => {
    if (endGame) addRecord(createGameRecord(endGame.game, createId(), Date.now()));
    actions.resetScores();
    setIsEndGameOpen(false);
  }, [addRecord, endGame, actions]);

  const restartWithoutSaving = useCallback(() => {
    actions.resetScores();
    setIsEndGameOpen(false);
  }, [actions]);

  const nextTurn = useCallback(() => {
    actions.nextTurn();
    impactFeedback();
  }, [actions]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Player>) => (
      <View style={styles.item}>
        <PlayerScoreCard
          player={item}
          name={displayName(item, index)}
          isCurrent={index === currentIndex}
          isLeader={leaderIds.has(item.id)}
          onChangeScore={actions.changeScore}
          onOpenScoreEntry={openScoreEntry}
        />
      </View>
    ),
    [currentIndex, leaderIds, actions, openScoreEntry],
  );

  const headerButtons = (
    <View style={styles.headerButtons}>
      <IconButton
        icon="arrow-undo"
        color={theme.primary}
        disabled={history.length === 0}
        onPress={actions.undo}
        accessibilityLabel="Annulla l'ultima modifica dei punti"
      />
      <IconButton
        icon="time-outline"
        color={theme.primary}
        onPress={() => router.push('/history')}
        accessibilityLabel="Storico partite"
      />
      <IconButton
        icon="people"
        color={theme.primary}
        onPress={() => router.push('/players')}
        accessibilityLabel="Gestisci giocatori"
      />
    </View>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <IconButton
              icon={theme.dark ? 'sunny' : 'moon'}
              color={theme.primary}
              onPress={toggleTheme}
              accessibilityLabel={theme.dark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
            />
          ),
          headerRight: () => headerButtons,
        }}
      />

      {!isHydrated || !currentPlayer ? (
        <ActivityIndicator style={styles.loading} color={theme.primary} />
      ) : (
        <>
          <View style={styles.status}>
            <View style={[styles.roundChip, { backgroundColor: theme.surfaceMuted }]}>
              <Text style={[styles.roundText, { color: theme.text }]}>Giro {round}</Text>
            </View>
            <Text style={[styles.turnText, { color: theme.textMuted }]} numberOfLines={1}>
              Tocca a{' '}
              <Text style={[styles.turnName, { color: theme.text }]}>
                {displayName(currentPlayer, currentIndex)}
              </Text>
            </Text>
            <Pressable
              onPress={openEndGame}
              accessibilityRole="button"
              accessibilityLabel="Termina partita"
              style={({ pressed }) => [
                styles.endButton,
                { backgroundColor: theme.surfaceMuted },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="flag" size={15} color={theme.text} />
              <Text style={[styles.endButtonText, { color: theme.text }]}>Termina</Text>
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={players}
            keyExtractor={(player) => player.id}
            renderItem={renderItem}
            getItemLayout={(_, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            contentContainerStyle={styles.list}
          />

          <View
            style={[
              styles.footer,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                borderTopColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
          >
            <IconButton
              icon="play-back"
              color={theme.text}
              backgroundColor={theme.surfaceMuted}
              disabled={currentIndex === 0 && round <= 1}
              onPress={actions.previousTurn}
              accessibilityLabel="Torna al turno precedente"
            />
            <Button
              label={
                players.length > 1
                  ? `Passa a ${displayName(players[nextPlayerIndex], nextPlayerIndex)}`
                  : 'Turno successivo'
              }
              icon="play-forward"
              onPress={nextTurn}
              style={styles.nextButton}
            />
          </View>
        </>
      )}

      <ScoreEntryModal
        visible={isEntryOpen && entryTarget !== null}
        playerName={entryTarget ? displayName(entryTarget, entryTargetIndex) : ''}
        score={entryTarget?.score ?? 0}
        onCancel={() => setIsEntryOpen(false)}
        onSubmit={(delta) => {
          if (entryTargetId) actions.changeScore(entryTargetId, delta);
          setIsEntryOpen(false);
        }}
      />

      {endGame && (
        <EndGameSheet
          visible={isEndGameOpen}
          game={endGame.game}
          now={endGame.openedAt}
          onCancel={() => setIsEndGameOpen(false)}
          onSaveAndRestart={saveAndRestart}
          onRestartWithoutSaving={restartWithoutSaving}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1 },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  roundChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  roundText: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  turnText: { flex: 1, fontSize: 16 },
  turnName: { fontWeight: '700' },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  endButtonText: { fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.6 },
  list: { paddingHorizontal: 16, paddingTop: 4, width: '100%', maxWidth: 640, alignSelf: 'center' },
  item: { height: ITEM_HEIGHT, paddingBottom: CARD_GAP },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nextButton: { flex: 1 },
});
