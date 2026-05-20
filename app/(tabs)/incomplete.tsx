import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Icon } from '../../src/components/Icon';
import { FieldReportHero } from '../../src/components/FieldReportHero';
import { SectionHeader } from '../../src/components/SectionHeader';
import { Avatar, hueFromId } from '../../src/components/Avatar';
import { useContacts } from '../../src/hooks/useContacts';
import { markComplete, missingFields, type ContactListItem } from '../../src/db/contacts';
import { getAccountStats } from '../../src/db/account';
import { colors, interestMeta, radius, typography } from '../../src/theme';
import { success } from '../../src/utils/haptics';

type FilterKey = 'all' | 'name' | 'contact';

export default function DraftsScreen() {
  const router = useRouter();
  const { data, reload } = useContacts({ only_incomplete: true, sort: 'date_met_desc' });
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterKey>('all');

  const loadTotal = useCallback(async () => {
    setTotal((await getAccountStats()).contacts);
  }, []);
  useEffect(() => { void loadTotal(); }, [loadTotal]);
  useFocusEffect(useCallback(() => { void loadTotal(); }, [loadTotal]));

  const counts = useMemo(() => {
    let name = 0, contact = 0;
    for (const d of data) {
      const m = missingFields(d);
      if (m.includes('name')) name++;
      if (m.includes('email or phone')) contact++;
    }
    return { all: data.length, name, contact };
  }, [data]);

  const filtered = useMemo(() => {
    if (filter === 'all') return data;
    return data.filter((d) => {
      const m = missingFields(d);
      if (filter === 'name') return m.includes('name');
      return m.includes('email or phone');
    });
  }, [data, filter]);

  const completed = Math.max(0, total - data.length);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function onGood(item: ContactListItem) {
    success();
    await markComplete(item.id, true);
    await reload();
    await loadTotal();
  }

  return (
    <Screen style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FieldReportHero
          kicker="LOOSE ENDS"
          rightSlot={
            <View style={styles.needsPill}>
              <Text style={styles.needsPillText}>NEEDS INFO</Text>
            </View>
          }
          title={
            <Text style={styles.heroTitle}>
              {data.length}
              {'\n'}
              <Text style={styles.heroTitleLight}>{data.length === 1 ? 'draft to clean.' : 'drafts to clean.'}</Text>
            </Text>
          }
          meta={['Captured fast, fill in later', 'Tap to complete']}
        >
          <View style={styles.progressWrap}>
            <View style={styles.progressHead}>
              <Text style={styles.progressLabel}>COMPLETION</Text>
              <Text style={styles.progressVal}>
                {completed}
                <Text style={styles.progressValDim}>/{total}</Text>
                <Text style={styles.progressPct}>  {pct}%</Text>
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
          </View>
        </FieldReportHero>

        {data.length > 0 && (
          <View style={styles.chipRowWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <Chip label="All" count={counts.all} active={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label="No name" count={counts.name} active={filter === 'name'} onPress={() => setFilter('name')} />
              <Chip label="No contact" count={counts.contact} active={filter === 'contact'} onPress={() => setFilter('contact')} />
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          {data.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Icon name="checkmark" size={36} color={colors.success} />
              </View>
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptyBody}>Every contact has what it needs.</Text>
            </View>
          ) : (
            <>
              <SectionHeader
                kicker="✦ TO COMPLETE"
                kickerColor={colors.accent}
                title={`${filtered.length} ${filtered.length === 1 ? 'contact' : 'contacts'} waiting.`}
              />
              {filtered.map((d, i) => {
                const dot = d.interest_level ? interestMeta[d.interest_level].dot : colors.border;
                const titleText = d.company_name || (d.contact_name ? `${d.contact_name} · (no company)` : '(no name)');
                const metaText = d.contact_name
                  ? `${d.contact_name}${d.role ? ' · ' + d.role : ''}`
                  : '(no contact name)';
                const missing = missingFields(d);
                const last = i === filtered.length - 1;
                return (
                  <View key={d.id} style={[styles.draftRow, last && styles.draftRowLast]}>
                    <View style={styles.draftTop}>
                      <Text style={styles.index}>{String(i + 1).padStart(2, '0')}</Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={styles.titleRow}>
                          <View style={[styles.intDot, { backgroundColor: dot }]} />
                          <Text
                            style={[styles.draftTitle, !d.company_name && styles.draftTitleMuted]}
                            numberOfLines={1}
                          >
                            {titleText}
                          </Text>
                        </View>
                        <Text style={[styles.draftMeta, !d.contact_name && styles.draftMetaMuted]} numberOfLines={1}>
                          {metaText}
                        </Text>

                        {missing.length > 0 && (
                          <View style={styles.missingBox}>
                            <Icon name="pencil" size={12} color={colors.accent} />
                            <Text style={styles.missingLabel}>MISSING</Text>
                            <Text style={styles.missingText} numberOfLines={1}>{missing.join(', ')}</Text>
                          </View>
                        )}

                        <View style={styles.actionRow}>
                          <Pressable
                            onPress={() => router.push({ pathname: '/contact/edit/[id]', params: { id: d.id } })}
                            style={[styles.actBtn, styles.actPrimary]}
                            hitSlop={4}
                          >
                            <Icon name="create-outline" size={12} color={colors.primary} />
                            <Text style={styles.actPrimaryText}>Add info</Text>
                          </Pressable>
                          <Pressable onPress={() => void onGood(d)} style={[styles.actBtn, styles.actGhost]} hitSlop={4}>
                            <Icon name="checkmark" size={12} color={colors.textSecondary} />
                            <Text style={styles.actGhostText}>Good as is</Text>
                          </Pressable>
                        </View>
                      </View>
                      <Avatar name={d.contact_name ?? d.company_name} hue={hueFromId(d.id)} size={32} />
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Chip({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} hitSlop={4}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
      <Text style={[styles.chipCount, active && styles.chipLabelActive]}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: 8, paddingBottom: 60 },

  needsPill: { backgroundColor: 'rgba(212,130,10,0.22)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  needsPillText: { fontSize: 11, fontWeight: '700', color: colors.hotNumeral, letterSpacing: 1 },
  heroTitle: { fontSize: 38, fontWeight: '700', letterSpacing: -1.5, lineHeight: 40, color: '#FFFFFF' },
  heroTitleLight: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  progressWrap: { marginTop: 22 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  progressLabel: { fontSize: 9.5, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  progressVal: { fontSize: 12, fontWeight: '700', color: '#fff', fontVariant: ['tabular-nums'] },
  progressValDim: { color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  progressPct: { color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.pulse, borderRadius: 4 },

  chipRowWrap: { paddingTop: 16 },
  chipRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipCount: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, fontVariant: ['tabular-nums'] },
  chipLabelActive: { color: colors.accent },

  section: { paddingHorizontal: 20, paddingTop: 20 },

  draftRow: { paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  draftRowLast: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  draftTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  index: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, width: 24, fontVariant: ['tabular-nums'], paddingTop: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  intDot: { width: 7, height: 7, borderRadius: 4 },
  draftTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2, flexShrink: 1 },
  draftTitleMuted: { color: colors.textTertiary, fontStyle: 'italic' },
  draftMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  draftMetaMuted: { color: colors.textTertiary, fontStyle: 'italic' },
  missingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, paddingVertical: 8, paddingHorizontal: 10,
    backgroundColor: colors.accentSoft, borderRadius: 10,
    borderWidth: 1, borderColor: '#F2E1B8',
  },
  missingLabel: { fontSize: 11, fontWeight: '700', color: colors.accent, letterSpacing: 0.6 },
  missingText: { fontSize: 12, color: colors.textPrimary, fontWeight: '600', flex: 1 },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  actPrimary: { backgroundColor: colors.primarySoft },
  actPrimaryText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  actGhost: { backgroundColor: colors.backgroundSoft },
  actGhostText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#E8F3E8',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 6 },
  emptyBody: { ...typography.secondary, textAlign: 'center' },
});
