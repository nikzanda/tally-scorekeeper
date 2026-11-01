import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useDeltaAccumulator } from '../hooks/useDeltaAccumulator';
import { useRepeatPress } from '../hooks/useRepeatPress';
import type { Player } from '../state/types';
import { useTheme } from '../theme';
import { getReadableTextColor, withAlpha } from '../utils/color';
import { selectionFeedback } from '../utils/haptics';

export const SCORE_CARD_HEIGHT = 136;

type Props = {
  player: Player;
  name: string;
  isCurrent: boolean;
  isLeader: boolean;
  onChangeScore: (id: string, delta: number) => void;
  onOpenScoreEntry: (id: string) => void;
};

const formatDelta = (delta: number) => (delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`);

export const PlayerScoreCard = memo(function PlayerScoreCard({
  player,
  name,
  isCurrent,
  isLeader,
  onChangeScore,
  onOpenScoreEntry,
}: Props) {
  const theme = useTheme();
  const [pendingDelta, pushDelta] = useDeltaAccumulator();
  const foreground = getReadableTextColor(player.color);
  const buttonBackground = withAlpha(foreground, 0.16);
  const fieldBackground = withAlpha(foreground, 0.1);

  const change = (delta: number) => {
    onChangeScore(player.id, delta);
    pushDelta(delta);
    selectionFeedback();
  };
  const decrement = useRepeatPress(() => change(-1));
  const increment = useRepeatPress(() => change(1));

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: player.color },
        isCurrent && [styles.current, { borderColor: theme.text }],
      ]}
    >
      <View style={styles.header}>
        {isLeader && (
          <Ionicons name="trophy" size={18} color={foreground} accessibilityLabel="In testa" />
        )}
        <Text style={[styles.name, { color: foreground }]} numberOfLines={1}>
          {name}
        </Text>
        {isCurrent && (
          <View style={[styles.turnChip, { backgroundColor: foreground }]}>
            <Ionicons name="play" size={12} color={player.color} />
            <Text style={[styles.turnChipText, { color: player.color }]}>Di turno</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <Pressable
          {...decrement}
          accessibilityRole="button"
          accessibilityLabel={`Togli un punto a ${name}`}
          accessibilityHint="Tieni premuto per togliere più punti"
          style={({ pressed }) => [
            styles.stepButton,
            { backgroundColor: buttonBackground },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="remove" size={34} color={foreground} />
        </Pressable>

        <Pressable
          onPress={() => onOpenScoreEntry(player.id)}
          style={({ pressed }) => [
            styles.scoreArea,
            { backgroundColor: fieldBackground },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${name}: ${player.score} punti`}
          accessibilityHint="Tocca per inserire a mano i punti da aggiungere o togliere"
        >
          <Text
            style={[styles.score, { color: foreground }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {player.score}
          </Text>
          {pendingDelta !== 0 && (
            <Animated.View
              entering={FadeIn.duration(120)}
              exiting={FadeOut.duration(300)}
              style={[styles.deltaBadge, { backgroundColor: foreground }]}
            >
              <Text style={[styles.deltaText, { color: player.color }]}>
                {formatDelta(pendingDelta)}
              </Text>
            </Animated.View>
          )}
        </Pressable>

        <Pressable
          {...increment}
          accessibilityRole="button"
          accessibilityLabel={`Aggiungi un punto a ${name}`}
          accessibilityHint="Tieni premuto per aggiungere più punti"
          style={({ pressed }) => [
            styles.stepButton,
            { backgroundColor: buttonBackground },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add" size={34} color={foreground} />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    height: SCORE_CARD_HEIGHT,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderWidth: 4,
    borderColor: 'transparent',
    justifyContent: 'space-between',
  },
  current: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  name: { flex: 1, fontSize: 18, fontWeight: '700' },
  turnChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  turnChipText: { fontSize: 13, fontWeight: '800' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreArea: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  score: { fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'] },
  deltaBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  deltaText: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.6 },
});
