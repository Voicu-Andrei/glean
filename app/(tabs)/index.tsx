import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { FAB } from '../../src/components/FAB';
import { Icon } from '../../src/components/Icon';
import { Avatar, hueFromId } from '../../src/components/Avatar';
import { FieldReportHero } from '../../src/components/FieldReportHero';
import { EditorialRow } from '../../src/components/EditorialRow';
import { useContacts } from '../../src/hooks/useContacts';
import { getAccountStats, type AccountStats } from '../../src/db/account';
import { colors, interestMeta, type InterestLevel } from '../../src/theme';
import type { ContactListItem } from '../../src/db/contacts';

type InterestFilter = 'all' | InterestLevel;

function groupOf(iso: string): 'today' | 'week' | 'earlier' {
  const d = new Date(iso);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const days = Math.round((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days < 7) return 'week';
  return 'earlier';
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${m[d.getMonth()]} ${d.getDate()}`;
}

const EMPTY: AccountStats = { events: 0, contacts: 0, hot: 0, warm: 0, cold: 0, thisWeek: 0, drafts: 0, tags: 0 };

export default function ContactsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [interest, setInterest] = useState<InterestFilter>('all');
  const [stats, setStats] = useState<AccountStats>(EMPTY);

  const loadStats = useCallback(async () => {
    setStats(await getAccountStats());
  }, []);
  useEffect(() => { void loadStats(); }, [loadStats]);
  useFocusEffect(useCallback(() => { void loadStats(); }, [loadStats]));

  const { data } = useContacts({
    search,
    interest: interest === 'all' ? null : interest,
    sort: 'date_met_desc',
  });

  const groups = useMemo(() => {
    const today: ContactListItem[] = [];
    const week: ContactListItem[] = [];
    const earlier: ContactListItem[] = [];
    for (const c of data) {
      const g = groupOf(c.date_met);
      if (g === 'today') today.push(c);
      else if (g === 'week') week.push(c);
      else earlier.push(c);
    }
    return { today, week, earlier };
  }, [data]);

  const total = stats.contacts;
  const segs = [
    { n: stats.hot, color: colors.hotDot },
    { n: stats.warm, color: colors.warmDot },
    { n: stats.cold, color: colors.coldDot },
  ].filter((s) => s.n > 0);

  let rowIndex = 0;
  const renderGroup = (label: string, items: ContactListItem[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.group} key={label}>
        <View style={styles.groupHead}>
          <Text style={styles.groupLabel}>{label}</Text>
          <Text style={styles.groupCount}>{items.length} captured</Text>
        </View>
        {items.map((c, i) => {
          rowIndex += 1;
          const dot = c.interest_level ? interestMeta[c.interest_level].dot : colors.border;
          const tags = (c.tag_names ?? '').split('|').filter(Boolean).slice(0, 2).map((t) => ({ label: t }));
          return (
            <EditorialRow
              key={c.id}
              index={String(rowIndex).padStart(2, '0')}
              title={c.company_name || '(no name)'}
              meta={[c.contact_name, c.role].filter(Boolean).join(' · ') || undefined}
              accentDot={dot}
              tags={tags}
              last={i === items.length - 1}
              muted={!c.company_name}
              onPress={() => router.push({ pathname: '/contact/[id]', params: { id: c.id } })}
              right={
                <View style={styles.rightWrap}>
                  <Text style={styles.rightDate}>{relativeDate(c.date_met)}</Text>
                  <Avatar name={c.contact_name ?? c.company_name} hue={hueFromId(c.id)} size={32} />
                </View>
              }
            />
          );
        })}
      </View>
    );
  };

  return (
    <Screen style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FieldReportHero
          kicker="DIRECTORY"
          title={
            <Text style={styles.heroTitle}>
              {total}
              {'\n'}
              <Text style={styles.heroTitleLight}>{total === 1 ? 'contact.' : 'contacts.'}</Text>
            </Text>
          }
          meta={[
            stats.thisWeek > 0 ? `+${stats.thisWeek} this week` : undefined,
            stats.drafts > 0 ? `${stats.drafts} drafts pending` : undefined,
          ]}
        >
          {total > 0 && (
            <View style={styles.breakdownWrap}>
              <View style={styles.breakdownBar}>
                {segs.map((s, i) => (
                  <View key={i} style={{ flex: s.n, backgroundColor: s.color, opacity: 0.95 }} />
                ))}
              </View>
              <View style={styles.legendRow}>
                <Legend dot={colors.hotDot} label="Hot" value={stats.hot} />
                <Legend dot={colors.warmDot} label="Warm" value={stats.warm} />
                <Legend dot={colors.coldDot} label="Cold" value={stats.cold} />
              </View>
            </View>
          )}
        </FieldReportHero>

        {/* Search + QR */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Icon name="search" size={15} color={colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search company, name, tag…"
              placeholderTextColor={colors.textTertiary}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            <Pressable onPress={() => router.push('/scan')} hitSlop={6} style={styles.qrBtn}>
              <Icon name="qr-code-outline" size={14} color={colors.primary} />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Chip label="All" count={total} active={interest === 'all'} onPress={() => setInterest('all')} />
            <Chip label="Hot" dot={colors.hotDot} count={stats.hot} active={interest === 'hot'} onPress={() => setInterest('hot')} />
            <Chip label="Warm" dot={colors.warmDot} count={stats.warm} active={interest === 'warm'} onPress={() => setInterest('warm')} />
            <Chip label="Cold" dot={colors.coldDot} count={stats.cold} active={interest === 'cold'} onPress={() => setInterest('cold')} />
          </ScrollView>
        </View>

        {data.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="people-outline" size={36} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>
              {search || interest !== 'all' ? 'No matches' : 'Ready when you are'}
            </Text>
            <Text style={styles.emptyBody}>
              {search || interest !== 'all'
                ? 'Try a different search or filter.'
                : 'Tap + to capture your first contact at the booth.'}
            </Text>
          </View>
        ) : (
          <>
            {renderGroup('Today', groups.today)}
            {renderGroup('Earlier this week', groups.week)}
            {renderGroup('Earlier', groups.earlier)}
          </>
        )}
      </ScrollView>
      <FAB onPress={() => router.push('/contact/new')} />
    </Screen>
  );
}

function Legend({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: dot }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendVal}>{value}</Text>
    </View>
  );
}

function Chip({ label, count, dot, active, onPress }: {
  label: string; count: number; dot?: string; active: boolean; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} hitSlop={4}>
      {dot && <View style={[styles.chipDot, { backgroundColor: dot }]} />}
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
      <Text style={[styles.chipCount, active && styles.chipLabelActive]}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: 8, paddingBottom: 100 },

  heroTitle: { fontSize: 38, fontWeight: '700', letterSpacing: -1.5, lineHeight: 40, color: '#FFFFFF' },
  heroTitleLight: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  breakdownWrap: { marginTop: 22 },
  breakdownBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 },
  legendRow: { flexDirection: 'row', marginTop: 10, gap: 16 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 },
  legendVal: { fontSize: 11, fontWeight: '700', color: '#fff', fontVariant: ['tabular-nums'] },

  searchWrap: { paddingHorizontal: 20, paddingTop: 16 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.borderSoft,
    paddingHorizontal: 14, paddingVertical: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, paddingVertical: 8 },
  qrBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },

  chipRow: { flexDirection: 'row', gap: 6, paddingTop: 12, paddingRight: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipCount: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, fontVariant: ['tabular-nums'] },
  chipLabelActive: { color: colors.primary },

  group: { paddingHorizontal: 20, paddingTop: 18 },
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  groupLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, textTransform: 'uppercase' },
  groupCount: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, fontVariant: ['tabular-nums'] },

  rightWrap: { alignItems: 'flex-end', gap: 6 },
  rightDate: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, fontVariant: ['tabular-nums'] },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.backgroundSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  emptyBody: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
