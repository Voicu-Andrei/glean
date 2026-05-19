import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { ContactCard } from '../../src/components/ContactCard';
import { Icon } from '../../src/components/Icon';
import { useContacts } from '../../src/hooks/useContacts';
import { markComplete, missingFields, type ContactListItem } from '../../src/db/contacts';
import { colors, radius, typography } from '../../src/theme';
import { success } from '../../src/utils/haptics';

export default function IncompleteScreen() {
  const router = useRouter();
  const { data, loading, reload } = useContacts({ only_incomplete: true, sort: 'date_met_desc' });

  const onMarkGood = useCallback(async (item: ContactListItem) => {
    success();
    await markComplete(item.id, true);
    await reload();
  }, [reload]);

  return (
    <Screen style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Drafts</Text>
        <Text style={styles.subtitle}>
          {data.length === 0
            ? 'All caught up'
            : `${data.length} ${data.length === 1 ? 'contact still needs' : 'contacts still need'} info`}
        </Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const missing = missingFields(item);
          return (
            <View>
              <ContactCard
                contact={item}
                subtitleOverride={
                  missing.length > 0
                    ? `Missing: ${missing.join(', ')}`
                    : (item.event_name ?? 'No event')
                }
                onPress={() =>
                  router.push({ pathname: '/contact/edit/[id]', params: { id: item.id } })
                }
              />
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/contact/edit/[id]', params: { id: item.id } })
                  }
                  style={[styles.btn, styles.btnPrimary]}
                  hitSlop={6}
                >
                  <Icon name="create-outline" size={14} color={colors.primary} />
                  <Text style={styles.btnPrimaryText}>Add info</Text>
                </Pressable>
                <Pressable
                  onPress={() => void onMarkGood(item)}
                  style={[styles.btn, styles.btnGhost]}
                  hitSlop={6}
                >
                  <Icon name="checkmark" size={14} color={colors.textSecondary} />
                  <Text style={styles.btnGhostText}>Good as is</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Icon name="checkmark-circle" size={48} color={colors.success} />
              </View>
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptyBody}>Every contact has what it needs.</Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.secondary, marginTop: 2 },
  listContent: { padding: 14, paddingBottom: 60 },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: -4,
    marginBottom: 14,
    paddingLeft: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  btnPrimary: { backgroundColor: colors.primarySoft },
  btnPrimaryText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  btnGhost: { backgroundColor: colors.backgroundSoft },
  btnGhostText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 90, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#E8F3E8',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary, marginTop: 12 },
  emptyBody: { ...typography.secondary, marginTop: 4 },
});
