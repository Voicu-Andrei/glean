import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { ActiveEventBanner } from '../../src/components/ActiveEventBanner';
import { ContactCard } from '../../src/components/ContactCard';
import { FAB } from '../../src/components/FAB';
import { FilterBar, type FilterState } from '../../src/components/FilterBar';
import { Icon } from '../../src/components/Icon';
import { useActiveEvent } from '../../src/hooks/useActiveEvent';
import { useContacts } from '../../src/hooks/useContacts';
import { colors, typography } from '../../src/theme';

export default function ContactsScreen() {
  const router = useRouter();
  const { event: activeEvent } = useActiveEvent();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    eventId: null,
    interest: null,
    tagIds: [],
    sort: 'date_met_desc',
  });

  const { data, loading } = useContacts({
    search,
    event_id: filters.eventId,
    interest: filters.interest,
    tag_ids: filters.tagIds,
    sort: filters.sort,
  });

  return (
    <Screen style={styles.flex}>
      <ActiveEventBanner event={activeEvent} />
      <View style={styles.searchWrap}>
        <Icon name="search" size={16} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <FilterBar state={filters} onChange={setFilters} />
      <FlatList
        data={data}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            onPress={() => router.push({ pathname: '/contact/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Icon name="people-outline" size={36} color={colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptyBody}>Tap the + button to capture your first contact.</Text>
            </View>
          ) : null
        }
      />
      <FAB onPress={() => router.push('/contact/new')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
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
  searchIcon: { fontSize: 14, color: colors.textSecondary },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 6 },
  listContent: { padding: 14, paddingTop: 4, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 90, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.backgroundSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 6 },
  emptyBody: { ...typography.secondary, textAlign: 'center' },
});
