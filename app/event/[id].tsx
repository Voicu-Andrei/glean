import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { ContactCard } from '../../src/components/ContactCard';
import { deleteEvent, getEvent, setActiveEvent, type EventRow } from '../../src/db/events';
import { listContacts, type ContactListItem } from '../../src/db/contacts';
import { exportContactsCsv } from '../../src/utils/export';
import { colors, radius, shadow, typography } from '../../src/theme';
import { formatDateRange } from '../../src/utils/format';

export default function EventDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [contacts, setContacts] = useState<ContactListItem[]>([]);

  const reload = useCallback(async () => {
    const e = await getEvent(id);
    setEvent(e);
    setContacts(await listContacts({ event_id: id, sort: 'date_met_desc' }));
  }, [id]);

  useEffect(() => { void reload(); }, [reload]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  if (!event) return <Screen style={styles.flex}><View /></Screen>;

  async function onExport() {
    try {
      await exportContactsCsv({ eventId: id, eventName: event!.name });
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
    }
  }

  async function onToggleActive() {
    if (event!.is_active === 1) {
      await setActiveEvent(null);
    } else {
      await setActiveEvent(id);
    }
    await reload();
  }

  function onDelete() {
    Alert.alert(
      `Delete "${event!.name}"?`,
      'Contacts attached to this event will remain but lose the event link.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(id);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <Screen style={styles.flex}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Pressable onPress={() => void onExport()} hitSlop={10}>
          <Text style={styles.export}>Share</Text>
        </Pressable>
      </View>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.subtitle}>
          {[event.location, formatDateRange(event.start_date, event.end_date)].filter(Boolean).join(' · ')}
        </Text>
        <Text style={[typography.secondary, { marginTop: 4 }]}>
          {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
        </Text>
        <View style={styles.btnRow}>
          <Pressable onPress={() => void onToggleActive()} style={[styles.actionBtn, event.is_active === 1 && styles.actionBtnPrimary]}>
            <Text style={[styles.actionLabel, event.is_active === 1 && { color: colors.surface }]}>
              {event.is_active === 1 ? '✓ Active Event' : 'Set as Active'}
            </Text>
          </Pressable>
          <Pressable onPress={() => void onExport()} style={styles.actionBtn}>
            <Text style={styles.actionLabel}>Export CSV</Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={contacts}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            onPress={() => router.push({ pathname: '/contact/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={typography.secondary}>No contacts captured at this event yet.</Text>
          </View>
        }
        ListFooterComponent={
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Delete event</Text>
          </Pressable>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  back: { fontSize: 16, color: colors.primary },
  export: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  headerCard: {
    backgroundColor: colors.surface,
    margin: 14,
    padding: 14,
    borderRadius: radius.card,
    ...shadow.card,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { ...typography.secondary, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  listContent: { paddingHorizontal: 14, paddingBottom: 60 },
  empty: { padding: 32, alignItems: 'center' },
  deleteBtn: { marginTop: 28, padding: 14, alignItems: 'center' },
  deleteText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
});
