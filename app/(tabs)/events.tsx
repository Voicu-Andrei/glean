import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Icon } from '../../src/components/Icon';
import { FieldReportHero } from '../../src/components/FieldReportHero';
import { SectionHeader } from '../../src/components/SectionHeader';
import { EditorialRow } from '../../src/components/EditorialRow';
import { useEvents } from '../../src/hooks/useEvents';
import { colors, radius, typography } from '../../src/theme';
import { formatDateRange } from '../../src/utils/format';
import type { EventWithCount } from '../../src/db/events';

type FilterKey = 'all' | 'active' | 'upcoming' | 'past';

function classify(e: EventWithCount, now: number): 'active' | 'upcoming' | 'past' {
  if (e.is_active === 1) return 'active';
  if (new Date(e.start_date).getTime() > now) return 'upcoming';
  return 'past';
}

export default function EventsScreen() {
  const router = useRouter();
  const { data } = useEvents();
  const [filter, setFilter] = useState<FilterKey>('all');
  const now = Date.now();

  const grouped = useMemo(() => {
    const active = data.find((e) => classify(e, now) === 'active') ?? null;
    const upcoming = data.filter((e) => classify(e, now) === 'upcoming');
    const past = data.filter((e) => classify(e, now) === 'past');
    return { active, upcoming, past };
  }, [data, now]);

  const totalCaptured = data.reduce((s, e) => s + e.contact_count, 0);
  const maxCaptured = Math.max(1, ...grouped.past.map((e) => e.contact_count));

  const showUpcoming = filter === 'all' || filter === 'upcoming';
  const showPast = filter === 'all' || filter === 'past';
  const showActive = filter === 'all' || filter === 'active';

  return (
    <Screen style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FieldReportHero
          kicker="THE CIRCUIT"
          live={!!grouped.active}
          rightSlot={
            <Pressable onPress={() => router.push('/event/new')} hitSlop={8}>
              <View style={styles.addBtn}>
                <Icon name="add" size={16} color="#FFFFFF" />
              </View>
            </Pressable>
          }
          title={<Text style={styles.heroTitle}>Events.</Text>}
          meta={[
            `${data.length} total`,
            `${totalCaptured} ${totalCaptured === 1 ? 'contact' : 'contacts'} captured`,
          ]}
        >
          {grouped.active ? (
            <Pressable
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: grouped.active!.id } })}
              style={styles.activeCard}
            >
              <View style={styles.happeningRow}>
                <View style={styles.pulse} />
                <Text style={styles.happeningText}>HAPPENING NOW</Text>
              </View>
              <Text style={styles.activeName} numberOfLines={1}>{grouped.active.name}</Text>
              <Text style={styles.activeMeta} numberOfLines={1}>
                {[grouped.active.location, formatDateRange(grouped.active.start_date, grouped.active.end_date)]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <View style={styles.activeStatRow}>
                <Text style={styles.activeBig}>{grouped.active.contact_count}</Text>
                <Text style={styles.activeUnit}>contacts captured</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.betweenCard}>
              <View style={styles.happeningRow}>
                <View style={[styles.pulse, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
                <Text style={[styles.happeningText, { color: 'rgba(255,255,255,0.7)' }]}>NO LIVE EVENT</Text>
              </View>
              <Text style={styles.activeName}>Between shows.</Text>
              <Text style={styles.betweenBody}>
                {grouped.upcoming.length > 0
                  ? `Next up: ${grouped.upcoming[0].name}`
                  : 'Set an upcoming event to start the next chapter.'}
              </Text>
              <Pressable onPress={() => router.push('/event/new')} style={styles.newEventBtn}>
                <Icon name="add" size={14} color={colors.primaryDeeper} />
                <Text style={styles.newEventText}>New event</Text>
              </Pressable>
            </View>
          )}
        </FieldReportHero>

        {data.length > 0 && (
          <View style={styles.chipRowWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <Chip label="All" count={data.length} active={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label="Active" count={grouped.active ? 1 : 0} active={filter === 'active'} onPress={() => setFilter('active')} />
              <Chip label="Upcoming" count={grouped.upcoming.length} active={filter === 'upcoming'} onPress={() => setFilter('upcoming')} />
              <Chip label="Past" count={grouped.past.length} active={filter === 'past'} onPress={() => setFilter('past')} />
            </ScrollView>
          </View>
        )}

        {showActive && grouped.active && (
          <View style={styles.section}>
            <SectionHeader kicker="◉ LIVE" kickerColor={colors.primary} title="Happening now." />
            <EditorialRow
              index="01"
              title={grouped.active.name}
              meta={[grouped.active.location, formatDateRange(grouped.active.start_date, grouped.active.end_date)].filter(Boolean).join(' · ')}
              accentDot={colors.success}
              tags={[{ label: `${grouped.active.contact_count} captured`, bg: colors.primarySoft, fg: colors.primary }]}
              last
              right={<ChevronCircle onPress={() => router.push({ pathname: '/event/[id]', params: { id: grouped.active!.id } })} />}
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: grouped.active!.id } })}
            />
          </View>
        )}

        {showUpcoming && grouped.upcoming.length > 0 && (
          <View style={styles.section}>
            <SectionHeader kicker="◐ UPCOMING" kickerColor={colors.primary} title="On the calendar." />
            {grouped.upcoming.map((e, i) => (
              <EditorialRow
                key={e.id}
                index={String(i + 1).padStart(2, '0')}
                title={e.name}
                meta={[e.location, formatDateRange(e.start_date, e.end_date)].filter(Boolean).join(' · ')}
                last={i === grouped.upcoming.length - 1}
                right={<ChevronCircle onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })} />}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
              />
            ))}
          </View>
        )}

        {showPast && grouped.past.length > 0 && (
          <View style={styles.section}>
            <SectionHeader kicker="◯ ARCHIVE" kickerColor={colors.textTertiary} title="What you've worked." />
            {grouped.past.map((e, i) => {
              const pct = Math.min(100, (e.contact_count / maxCaptured) * 100);
              const last = i === grouped.past.length - 1;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
                  style={[styles.pastRow, last && styles.pastRowLast]}
                >
                  <Text style={styles.index}>{String(i + 1).padStart(2, '0')}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.pastName} numberOfLines={1}>{e.name}</Text>
                    <Text style={styles.pastMeta} numberOfLines={1}>
                      {[e.location, formatDateRange(e.start_date, e.end_date)].filter(Boolean).join(' · ')}
                    </Text>
                    <View style={styles.barRow}>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.barVal}>{e.contact_count}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {data.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="calendar-outline" size={36} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyBody}>Create an event to start capturing contacts.</Text>
            <Pressable onPress={() => router.push('/event/new')} style={styles.emptyCta}>
              <Text style={styles.emptyCtaText}>Create your first event</Text>
            </Pressable>
          </View>
        )}
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

function ChevronCircle({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.chevCircle} hitSlop={6}>
      <Icon name="chevron-forward" size={14} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: 8, paddingBottom: 60 },

  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 38, fontWeight: '700', letterSpacing: -1.5, lineHeight: 40, color: '#FFFFFF' },

  activeCard: { marginTop: 22, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)' },
  betweenCard: {
    marginTop: 22, paddingVertical: 18, paddingHorizontal: 16, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.22)',
  },
  happeningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  pulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.pulse },
  happeningText: { fontSize: 10, fontWeight: '700', color: colors.pulse, letterSpacing: 1 },
  activeName: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  activeMeta: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  activeStatRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 12 },
  activeBig: { fontSize: 32, fontWeight: '700', color: '#fff', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  activeUnit: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  betweenBody: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 18 },
  newEventBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 14, backgroundColor: colors.pulse, paddingVertical: 10, borderRadius: 999,
  },
  newEventText: { color: colors.primaryDeeper, fontWeight: '700', fontSize: 13, letterSpacing: 0.2 },

  chipRowWrap: { paddingTop: 16 },
  chipRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipCount: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, fontVariant: ['tabular-nums'] },
  chipLabelActive: { color: colors.primary },

  section: { paddingHorizontal: 20, paddingTop: 20 },
  chevCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },

  pastRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  pastRowLast: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  index: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, width: 24, fontVariant: ['tabular-nums'] },
  pastName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 },
  pastMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  barTrack: { flex: 1, height: 3, backgroundColor: colors.backgroundSoft, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  barVal: { fontSize: 11, fontWeight: '700', color: colors.textPrimary, fontVariant: ['tabular-nums'] },

  empty: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 24 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.backgroundSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 6 },
  emptyBody: { ...typography.secondary, textAlign: 'center', marginBottom: 16 },
  emptyCta: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.pill },
  emptyCtaText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
});
