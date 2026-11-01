import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../components/IconButton';
import { RankingList } from '../components/RankingList';
import type { GameRecord } from '../state/history';
import { useHistory } from '../state/HistoryContext';
import { useTheme } from '../theme';
import { confirmAction } from '../utils/confirm';
import { capitalize, formatDateTime, formatDuration, roundsLabel } from '../utils/format';

export default function HistoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { records, isHydrated, removeRecord, clearHistory } = useHistory();

  const deleteRecord = useCallback(
    async (record: GameRecord) => {
      const confirmed = await confirmAction({
        title: 'Eliminare la partita?',
        message: `La partita del ${formatDateTime(record.endedAt)} verrà rimossa dallo storico.`,
        confirmText: 'Elimina',
        destructive: true,
      });
      if (confirmed) removeRecord(record.id);
    },
    [removeRecord],
  );

  const clearAll = useCallback(async () => {
    const confirmed = await confirmAction({
      title: 'Svuotare lo storico?',
      message: `Verranno eliminate tutte le ${records.length} partite salvate.`,
      confirmText: 'Svuota',
      destructive: true,
    });
    if (confirmed) clearHistory();
  }, [records.length, clearHistory]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<GameRecord>) => {
      const details = [
        roundsLabel(item.rounds),
        item.startedAt !== null ? formatDuration(item.endedAt - item.startedAt) : null,
        item.winCondition === 'lowest' ? 'vince chi ha meno punti' : null,
      ].filter(Boolean);
      return (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <Text style={[styles.date, { color: theme.text }]}>
                {capitalize(formatDateTime(item.endedAt))}
              </Text>
              <Text style={[styles.details, { color: theme.textMuted }]}>
                {details.join(' · ')}
              </Text>
            </View>
            <IconButton
              icon="trash-outline"
              color={theme.danger}
              size={20}
              onPress={() => void deleteRecord(item)}
              accessibilityLabel={`Elimina la partita del ${formatDateTime(item.endedAt)}`}
            />
          </View>
          <RankingList players={item.players} winCondition={item.winCondition} />
        </View>
      );
    },
    [theme, deleteRecord],
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon="trash-bin-outline"
              color={theme.danger}
              disabled={records.length === 0}
              onPress={() => void clearAll()}
              accessibilityLabel="Svuota lo storico"
            />
          ),
        }}
      />
      {!isHydrated ? (
        <ActivityIndicator style={styles.loading} color={theme.primary} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(record) => record.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
            records.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Nessuna partita salvata</Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Durante una partita tocca «Termina» e poi «Salva e inizia nuova»: la troverai qui.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1 },
  list: { padding: 16, gap: 12, width: '100%', maxWidth: 640, alignSelf: 'center' },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  card: { borderRadius: 16, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, gap: 2 },
  date: { fontSize: 16, fontWeight: '700' },
  details: { fontSize: 14 },
  empty: { alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 15, lineHeight: 21, textAlign: 'center' },
});
