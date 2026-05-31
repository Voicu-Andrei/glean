import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { Icon } from '../src/components/Icon';
import { FieldReportHero } from '../src/components/FieldReportHero';
import { SectionHeader } from '../src/components/SectionHeader';
import { listFollowUps, setFollowUpDone, type FollowUpRow } from '../src/db/contacts';
import { colors, typography } from '../src/theme';
import { formatDate } from '../src/utils/format';
import { success } from '../src/utils/haptics';

type Bucket = 'overdue' | 'today' | 'week' | 'later' | 'done';

function bucketOf(row: FollowUpRow): Bucket {
  if (row.follow_up_done === 1) return 'done';
  const due = new Date(row.follow_up_date);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days < 7) return 'week';
  return 'later';
}

const BUCKETS: { key: Bucket; label: string; kicker: string; kickerColor?: string }[] = [
  { key: 'overdue', label: 'Overdue.', kicker: '⊘ OVERDUE', kickerColor: '#C73E1D' },
  { key: 'today', label: 'Today.', kicker: '⊙ TODAY' },
  { key: 'week', label: 'This week.', kicker: '◐ THIS WEEK' },
  { key: 'later', label: 'Later.', kicker: '◯ LATER' },
  { key: 'done', label: 'Done.', kicker: '✓ DONE' },
];

export default function MeetingsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<FollowUpRow[]>([]);

  const reload = useCallback(async () => {
    setRows(await listFollowUps());
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  async function toggleDone(row: FollowUpRow) {
    success();
    await setFollowUpDone(row.id, row.follow_up_done === 0);
    await reload();
  }

  const grouped: Record<Bucket, FollowUpRow[]> = {
    overdue: [], today: [], week: [], later: [], done: [],
  };
  for (const r of rows) grouped[bucketOf(r)].push(r);

  const pendingCount = grouped.overdue.length + grouped.today.length + grouped.week.length + grouped.later.length;
  const doneCount = grouped.done.length;

  return (
    <Screen style={styles.flex}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Icon name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Meetings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FieldReportHero
          kicker="THE DOCKET"
          title={
            <Text style={styles.heroTitle}>
              {pendingCount}
              {'\n'}
              <Text style={styles.heroTitleLight}>{pendingCount === 1 ? 'follow-up.' : 'follow-ups.'}</Text>
            </Text>
          }
          meta={[
            grouped.overdue.length > 0 ? `${grouped.overdue.length} overdue` : undefined,
            doneCount > 0 ? `${doneCount} done` : undefined,
          ]}
        />

        {pendingCount === 0 && doneCount === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="alarm-outline" size={36} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No meetings scheduled</Text>
            <Text style={styles.emptyBody}>
              Add a follow-up date to any contact and it'll show up here.
            </Text>
          </View>
        )}

        {BUCKETS.map((b) => {
          const items = grouped[b.key];
          if (items.length === 0) return null;
          return (
            <View key={b.key} style={styles.section}>
              <SectionHeader kicker={b.kicker} kickerColor={b.kickerColor} title={b.label} />
              {items.map((r, i) => {
                const done = r.follow_up_done === 1;
                const last = i === items.length - 1;
                return (
                  <View key={r.id} style={[styles.row, last && styles.rowLast]}>
                    <Pressable onPress={() => void toggleDone(r)} hitSlop={6} style={styles.checkbox}>
                      <View style={[styles.checkboxBox, done && styles.checkboxBoxDone]}>
                        {done && <Icon name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push({ pathname: '/contact/[id]', params: { id: r.id } })}
                      style={styles.rowBody}
                    >
                      <Text style={[styles.rowDate, b.key === 'overdue' && { color: '#C73E1D' }]}>
                        {formatDate(r.follow_up_date)}
                      </Text>
                      <Text
                        style={[styles.rowTitle, done && styles.rowTitleDone]}
                        numberOfLines={1}
                      >
                        {r.company_name}
                      </Text>
                      {(r.contact_name || r.role) ? (
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          {[r.contact_name, r.role].filter(Boolean).join(' · ')}
                          {r.event_name ? ` · ${r.event_name}` : ''}
                        </Text>
                      ) : (
                        r.event_name ? (
                          <Text style={styles.rowMeta} numberOfLines={1}>{r.event_name}</Text>
                        ) : null
                      )}
                      {r.follow_up_notes ? (
                        <Text style={styles.rowNote} numberOfLines={2}>{r.follow_up_notes}</Text>
                      ) : null}
                    </Pressable>
                    <Icon name="chevron-forward" size={14} color={colors.textTertiary} />
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  scroll: { paddingTop: 4, paddingBottom: 60 },

  heroTitle: { fontSize: 38, fontWeight: '700', letterSpacing: -1.5, lineHeight: 40, color: '#FFFFFF' },
  heroTitleLight: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  section: { paddingHorizontal: 20, paddingTop: 20 },

  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider,
  },
  rowLast: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  checkbox: { paddingTop: 4 },
  checkboxBox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxBoxDone: { backgroundColor: colors.success, borderColor: colors.success },
  rowBody: { flex: 1, minWidth: 0 },
  rowDate: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase' },
  rowTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2, marginTop: 2 },
  rowTitleDone: { color: colors.textTertiary, textDecorationLine: 'line-through' },
  rowMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  rowNote: { fontSize: 12, color: colors.textSecondary, marginTop: 6, fontStyle: 'italic', lineHeight: 16 },

  empty: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 32 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.backgroundSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 6 },
  emptyBody: { ...typography.secondary, textAlign: 'center' },
});
