import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { useEvents } from '../../src/hooks/useEvents';
import { colors, radius, elevation, typography } from '../../src/theme';
import { formatDateRange } from '../../src/utils/format';
import type { EventWithCount } from '../../src/db/events';

export default function EventsScreen() {
  const router = useRouter();
  const { data } = useEvents();

  const active = data.filter((e) => e.is_active === 1);
  const past = data.filter((e) => e.is_active === 0);

  return (
    <Screen style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Pressable onPress={() => router.push('/event/new')}>
          <Text style={styles.headerAction}>+ New</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {active.length > 0 && (
          <>
            <Text style={typography.sectionLabel}>Active</Text>
            {active.map((e) => (
              <EventCard key={e.id} event={e} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })} active />
            ))}
          </>
        )}
        {past.length > 0 && (
          <>
            <Text style={[typography.sectionLabel, { marginTop: 16 }]}>Past & Upcoming</Text>
            {past.map((e) => (
              <EventCard key={e.id} event={e} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })} active={false} />
            ))}
          </>
        )}
        {data.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyBody}>Create an event to start capturing contacts.</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function EventCard({
  event,
  onPress,
  active,
}: {
  event: EventWithCount;
  onPress: () => void;
  active: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
      <View style={styles.cardRow}>
        {active && <View style={styles.activeDot} />}
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
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  headerAction: { fontSize: 15, fontWeight: '600', color: colors.primary },
  scroll: { padding: 14, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    marginTop: 10,
    ...elevation.card,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32', marginTop: 6 },
  cardTitle: { ...typography.companyList, color: colors.textPrimary },
  cardSubtitle: { ...typography.secondary, marginTop: 2 },
  cardCount: { ...typography.secondary, marginTop: 4, color: colors.primary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { ...typography.companyList, color: colors.textPrimary, marginBottom: 6 },
  emptyBody: { ...typography.secondary },
});
