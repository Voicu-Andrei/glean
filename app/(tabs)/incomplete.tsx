import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContactCard } from '../../src/components/ContactCard';
import { useContacts } from '../../src/hooks/useContacts';
import { missingFields } from '../../src/db/contacts';
import { colors, typography } from '../../src/theme';

export default function IncompleteScreen() {
  const router = useRouter();
  const { data, loading } = useContacts({ only_incomplete: true, sort: 'date_met_desc' });

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
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
              <Text style={styles.emptyIcon}>✓</Text>
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptyBody}>Every contact has what it needs.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { ...typography.secondary, marginTop: 2 },
  listContent: { padding: 14, paddingBottom: 60 },
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, color: colors.primary },
  emptyTitle: { ...typography.companyList, color: colors.textPrimary, marginTop: 12 },
  emptyBody: { ...typography.secondary, marginTop: 4 },
});
