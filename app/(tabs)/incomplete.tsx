import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { ContactCard } from '../../src/components/ContactCard';
import { Icon } from '../../src/components/Icon';
import { useContacts } from '../../src/hooks/useContacts';
import { missingFields } from '../../src/db/contacts';
import { colors, typography } from '../../src/theme';

export default function IncompleteScreen() {
  const router = useRouter();
  const { data, loading } = useContacts({ only_incomplete: true, sort: 'date_met_desc' });

  return (
    <Screen style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Contacts</Text>
        <Text style={styles.subtitle}>
          {data.length === 0
            ? 'All caught up'
            : `${data.length} ${data.length === 1 ? 'contact needs' : 'contacts need'} info`}
        </Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const missing = missingFields(item);
          return (
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
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { ...typography.secondary, marginTop: 2 },
  listContent: { padding: 14, paddingBottom: 60 },
  empty: { alignItems: 'center', paddingTop: 90, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#E8F3E8',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { ...typography.companyList, color: colors.textPrimary, marginTop: 12 },
  emptyBody: { ...typography.secondary, marginTop: 4 },
});
