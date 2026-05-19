import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Icon } from '../../src/components/Icon';
import { useEvents } from '../../src/hooks/useEvents';
import { colors, radius, elevation, typography } from '../../src/theme';
import { formatDateRange } from '../../src/utils/format';
import type { EventWithCount } from '../../src/db/events';

type FilterKey = 'all' | 'active' | 'upcoming' | 'past';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

export default function EventsScreen() {
  const router = useRouter();
  const { data } = useEvents();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    return data.filter((e) => {
      if (q) {
        const hay = `${e.name} ${e.location ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter === 'active') return e.is_active === 1;
      if (filter === 'upcoming') {
        return e.is_active === 0 && new Date(e.start_date).getTime() > now;
      }
      if (filter === 'past') {
        const end = e.end_date ? new Date(e.end_date).getTime() : new Date(e.start_date).getTime();
        return e.is_active === 0 && end < now;
      }
      return true;
    });
  }, [data, query, filter]);

  const totalCount = data.length;

  return (
    <Screen style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Pressable onPress={() => router.push('/event/new')} hitSlop={6}>
          <View style={styles.addBtn}>
            <Icon name="add" size={18} color={colors.surface} />
          </View>
        </Pressable>
      </View>

      {totalCount > 0 && (
        <>
          <View style={styles.searchWrap}>
            <Icon name="search" size={16} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or location"
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, filter === f.key && styles.chipActive]}
                hitSlop={4}
              >
                <Text style={[styles.chipLabel, filter === f.key && styles.chipLabelActive]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {filtered.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
          />
        ))}
        {totalCount === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="calendar-outline" size={36} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyBody}>Create an event to start capturing contacts.</Text>
          </View>
        )}
        {totalCount > 0 && filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyBody}>
              No {filter === 'all' ? '' : filter + ' '}events {query ? `match "${query}"` : 'right now'}.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function EventCard({
  event,
  onPress,
}: {
  event: EventWithCount;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
      <View style={styles.cardRow}>
        <View style={[styles.activeDot, { backgroundColor: event.is_active === 1 ? colors.success : colors.border }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{event.name}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {[event.location, formatDateRange(event.start_date, event.end_date)].filter(Boolean).join(' · ')}
          </Text>
          <Text style={styles.cardCount}>
            {event.contact_count} {event.contact_count === 1 ? 'contact' : 'contacts'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: { ...typography.title, color: colors.textPrimary },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 14,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 6 },
  chipRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipLabelActive: { color: colors.primary },
  scroll: { padding: 14, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    marginTop: 10,
    ...elevation.card,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  activeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  cardTitle: { ...typography.companyList, color: colors.textPrimary },
  cardSubtitle: { ...typography.secondary, marginTop: 2 },
  cardCount: { ...typography.secondary, marginTop: 4, color: colors.primary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.backgroundSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 6 },
  emptyBody: { ...typography.secondary, textAlign: 'center' },
});
