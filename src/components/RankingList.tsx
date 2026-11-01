import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { getLeaderIds, rankPlayers } from '../state/ranking';
import type { Player, WinCondition } from '../state/types';
import { useTheme } from '../theme';

type Props = {
  players: readonly Player[];
  winCondition: WinCondition;
  /** Name to show for each player, e.g. with the default-name fallback applied. */
  getName?: (player: Player) => string;
};

export function RankingList({ players, winCondition, getName = (player) => player.name }: Props) {
  const theme = useTheme();
  const winners = getLeaderIds(players, winCondition);

  return (
    <View style={styles.list}>
      {rankPlayers(players, winCondition).map(({ item: player, position }) => {
        const isWinner = winners.has(player.id);
        return (
          <View
            key={player.id}
            style={styles.row}
            accessible
            accessibilityLabel={`${position}°, ${getName(player)}, ${player.score} punti${isWinner ? ', vincitore' : ''}`}
          >
            <Text style={[styles.position, { color: theme.textMuted }]}>{position}.</Text>
            <View
              style={[styles.colorDot, { backgroundColor: player.color, borderColor: theme.border }]}
            />
            <Text
              style={[styles.name, { color: theme.text }, isWinner && styles.winnerText]}
              numberOfLines={1}
            >
              {getName(player)}
            </Text>
            {isWinner && <Ionicons name="trophy" size={16} color="#E0A800" />}
            <Text style={[styles.score, { color: theme.text }, isWinner && styles.winnerText]}>
              {player.score}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  position: { width: 26, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  colorDot: { width: 14, height: 14, borderRadius: 7, borderWidth: StyleSheet.hairlineWidth },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  score: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  winnerText: { fontWeight: '800' },
});
