import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { FAB } from '../../src/components/FAB';
import { Icon } from '../../src/components/Icon';
import { Avatar, hueFromId } from '../../src/components/Avatar';
import { HourlyBars } from '../../src/components/HourlyBars';
import { StatPanel } from '../../src/components/StatPanel';
import { FieldReportHero } from '../../src/components/FieldReportHero';
import { SectionHeader } from '../../src/components/SectionHeader';
import { useDashboard } from '../../src/hooks/useDashboard';
import { colors, radius, typography } from '../../src/theme';
import { formatDate } from '../../src/utils/format';

export default function DashboardScreen() {
  const router = useRouter();
  const { stats } = useDashboard();
  const ev = stats.activeEvent;

  return (
    <Screen style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {ev ? (
          <Pressable onPress={() => router.push({ pathname: '/event/[id]', params: { id: ev.id } })}>
            <FieldReportHero
              live
              kicker="FIELD REPORT"
              rightSlot={<Icon name="settings-outline" size={20} color="rgba(255,255,255,0.7)" />}
              title={<Text style={styles.heroTitle} numberOfLines={2}>{ev.name}.</Text>}
              meta={[
                ev.location || undefined,
                ev.start_date ? formatDate(ev.start_date) : undefined,
                stats.dayOfEvent && stats.totalDays ? `Day ${stats.dayOfEvent}/${stats.totalDays}` : undefined,
              ]}
            >
              <View style={styles.statGrid}>
                <StatPanel label="TODAY" value={countToday(stats.hourlyCaptures)} sub="contacts captured" />
                <View style={styles.statSep} />
                <StatPanel label="HOT" value={stats.hotCount} valueColor={colors.hotNumeral} sub="all-time" />
                <View style={styles.statSep} />
                <StatPanel label="TOTAL" value={stats.activeEventContacts} sub={`all ${stats.totalDays ?? '—'} days`} />
              </View>

              <View style={styles.hourlyHeader}>
                <Text style={styles.hourlyLabel}>HOURLY</Text>
                <Text style={styles.hourlyRange}>9a — 6p</Text>
              </View>
              <HourlyBars values={stats.hourlyCaptures.slice(9, 19)} />
            </FieldReportHero>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/(tabs)/events')} style={styles.coverEmpty}>
            <Icon name="calendar-outline" size={20} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyEventTitle}>No active event</Text>
              <Text style={styles.emptyEventBody}>Pick one before capturing</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        )}

        {stats.topHot.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              kicker="★ HOT LEADS"
              kickerColor={colors.hotDot}
              title="Worth the call back."
              action={{ label: 'All →', onPress: () => router.push('/(tabs)') }}
            />

            <View style={styles.pile}>
              {stats.topHot.slice(0, 5).map((c, i) => (
                <View key={c.id} style={{ marginLeft: i === 0 ? 0 : -12 }}>
                  <Avatar name={c.contact_name ?? c.company_name} hue={hueFromId(c.id)} size={42} ring />
                </View>
              ))}
              {stats.hotCount > 5 ? (
                <View style={styles.pileMore}>
                  <Text style={styles.pileMoreText}>+{stats.hotCount - 5}</Text>
                </View>
              ) : null}
            </View>

            {stats.topHot.slice(0, 2).map((c, i) => (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/contact/[id]', params: { id: c.id } })}
                style={styles.editorialRow}
              >
                <Text style={styles.rowIndex}>0{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowCompany} numberOfLines={1}>{c.company_name}</Text>
                  {(c.contact_name || c.role) ? (
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {[c.contact_name, c.role].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                  {(c.tag_names ?? '').split('|').filter(Boolean).slice(0, 2).length > 0 && (
                    <View style={styles.tagRow}>
                      {(c.tag_names ?? '').split('|').filter(Boolean).slice(0, 2).map((t) => (
                        <View key={t} style={styles.tag}>
                          <Text style={styles.tagText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.rowArrow}>
                  <Icon name="arrow-forward" size={14} color={colors.primary} />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {stats.nextFollowUp && (
          <View style={[styles.section, styles.nextUpSection]}>
            <View style={styles.nextUpHead}>
              <Icon name="alarm-outline" size={13} color={colors.accent} />
              <Text style={styles.nextUpLabel}>NEXT UP</Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: '/contact/[id]', params: { id: stats.nextFollowUp!.id } })}
            >
              <Text style={styles.nextUpBody}>
                <Text style={styles.nextUpStrong}>{formatDate(stats.nextFollowUp.follow_up_date)}</Text>
                {stats.nextFollowUp.follow_up_notes ? ` — ${stats.nextFollowUp.follow_up_notes}` : ''}{' '}
                for{' '}
                <Text style={styles.nextUpCompany}>{stats.nextFollowUp.company_name}</Text>.
              </Text>
            </Pressable>
          </View>
        )}

        {stats.totalContacts === 0 && !ev && (
          <View style={styles.welcomeEmpty}>
            <View style={styles.welcomeIcon}>
              <Icon name="sparkles" size={36} color={colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Welcome to Glean</Text>
            <Text style={styles.welcomeBody}>
              Create an event, then start capturing companies you meet at the booth.
            </Text>
            <Pressable onPress={() => router.push('/event/new')} style={styles.welcomeCta}>
              <Text style={styles.welcomeCtaText}>Create your first event</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <FAB onPress={() => router.push('/contact/new')} />
    </Screen>
  );
}

function countToday(hourlyCaptures: number[]): number {
  return hourlyCaptures.reduce((s, n) => s + n, 0);
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: 8, paddingBottom: 100 },

  heroTitle: { fontSize: 38, fontWeight: '700', letterSpacing: -1.5, lineHeight: 40, color: '#FFFFFF' },

  coverEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statGrid: {
    flexDirection: 'row',
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  statSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },

  hourlyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 6 },
  hourlyLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.55)' },
  hourlyRange: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },

  section: { paddingHorizontal: 20, paddingTop: 22 },

  pile: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pileMore: {
    marginLeft: -12,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 2, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 0 }, shadowRadius: 1,
  },
  pileMoreText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },

  editorialRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider,
  },
  rowIndex: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, width: 24, fontVariant: ['tabular-nums'] },
  rowCompany: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 },
  rowMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: { backgroundColor: colors.backgroundSoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  tagText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },
  rowArrow: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },

  nextUpSection: { paddingTop: 14 },
  nextUpHead: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider,
  },
  nextUpLabel: { fontSize: 11, fontWeight: '700', color: colors.accent, letterSpacing: 1.2 },
  nextUpBody: { fontSize: 16, color: colors.textPrimary, letterSpacing: -0.2, lineHeight: 22 },
  nextUpStrong: { fontWeight: '700' },
  nextUpCompany: { color: colors.primary, fontWeight: '700' },

  welcomeEmpty: { alignItems: 'center', paddingTop: 30, paddingHorizontal: 24 },
  welcomeIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  welcomeTitle: { ...typography.title, color: colors.textPrimary, marginBottom: 6 },
  welcomeBody: { ...typography.secondary, textAlign: 'center', marginBottom: 16 },
  welcomeCta: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.pill },
  welcomeCtaText: { color: colors.surface, fontWeight: '700', fontSize: 14 },

  emptyEventTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  emptyEventBody: { ...typography.tertiary, marginTop: 2 },
});
