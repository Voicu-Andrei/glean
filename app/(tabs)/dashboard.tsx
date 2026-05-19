import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { FAB } from '../../src/components/FAB';
import { Icon } from '../../src/components/Icon';
import { Avatar, hueFromId } from '../../src/components/Avatar';
import { HourlyBars } from '../../src/components/HourlyBars';
import { StatPanel } from '../../src/components/StatPanel';
import { useDashboard } from '../../src/hooks/useDashboard';
import { colors, radius, typography } from '../../src/theme';
import { formatDate } from '../../src/utils/format';

const PRIMARY_DEEPER = '#0C3C3C';
const PULSE = '#9DE0AD';
const HOT_NUMERAL = '#FBC68B';

export default function DashboardScreen() {
  const router = useRouter();
  const { stats } = useDashboard();
  const ev = stats.activeEvent;

  return (
    <Screen style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {ev ? (
          <Pressable
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: ev.id } })}
            style={styles.cover}
          >
            <View style={styles.coverHeader}>
              <View style={styles.livePill}>
                <View style={styles.pulse} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.fieldLabel}>FIELD REPORT</Text>
              <View style={{ flex: 1 }} />
              <Icon name="settings-outline" size={20} color="rgba(255,255,255,0.7)" />
            </View>

            <Text style={styles.eventName} numberOfLines={2}>
              {ev.name}.
            </Text>

            <View style={styles.metaRow}>
              {ev.location ? (
                <>
                  <Icon name="location" size={11} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.metaText}>{ev.location}</Text>
                  <Dot />
                </>
              ) : null}
              {ev.start_date ? (
                <>
                  <Text style={styles.metaText}>{formatDate(ev.start_date)}</Text>
                  <Dot />
                </>
              ) : null}
              {stats.dayOfEvent && stats.totalDays ? (
                <Text style={styles.metaText}>
                  Day {stats.dayOfEvent}/{stats.totalDays}
                </Text>
              ) : null}
            </View>

            <View style={styles.statGrid}>
              <StatPanel
                label="TODAY"
                value={countToday(stats.hourlyCaptures)}
                sub="contacts captured"
              />
              <View style={styles.statSep} />
              <StatPanel
                label="HOT"
                value={stats.hotCount}
                valueColor={HOT_NUMERAL}
                sub="all-time"
              />
              <View style={styles.statSep} />
              <StatPanel
                label="TOTAL"
                value={stats.activeEventContacts}
                sub={`all ${stats.totalDays ?? '—'} days`}
              />
            </View>

            <View style={styles.hourlyHeader}>
              <Text style={styles.hourlyLabel}>HOURLY</Text>
              <Text style={styles.hourlyRange}>9a — 6p</Text>
            </View>
            <HourlyBars values={stats.hourlyCaptures.slice(9, 19)} />
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
            <View style={styles.sectionHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionKicker}>★ HOT LEADS</Text>
                <Text style={styles.sectionTitle}>Worth the call back.</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)')} hitSlop={6}>
                <Text style={styles.allLink}>All →</Text>
              </Pressable>
            </View>

            <View style={styles.pile}>
              {stats.topHot.slice(0, 5).map((c, i) => (
                <View key={c.id} style={{ marginLeft: i === 0 ? 0 : -12 }}>
                  <Avatar
                    name={c.contact_name ?? c.company_name}
                    hue={hueFromId(c.id)}
                    size={42}
                    ring
                  />
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
                      {(c.tag_names ?? '')
                        .split('|')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((t) => (
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
              onPress={() =>
                router.push({ pathname: '/contact/[id]', params: { id: stats.nextFollowUp!.id } })
              }
            >
              <Text style={styles.nextUpBody}>
                <Text style={styles.nextUpStrong}>
                  {formatDate(stats.nextFollowUp.follow_up_date)}
                </Text>
                {stats.nextFollowUp.follow_up_notes
                  ? ` — ${stats.nextFollowUp.follow_up_notes}`
                  : ''}{' '}
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

function Dot() {
  return <View style={styles.metaDot} />;
}

function countToday(hourlyCaptures: number[]): number {
  return hourlyCaptures.reduce((s, n) => s + n, 0);
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 100 },

  cover: {
    backgroundColor: PRIMARY_DEEPER,
    borderRadius: 28,
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  coverEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: PULSE },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.92)',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.4,
  },

  eventName: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 40,
    color: '#FFFFFF',
    marginTop: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },

  statGrid: {
    flexDirection: 'row',
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  statSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },

  hourlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  hourlyLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.55)',
  },
  hourlyRange: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },

  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.hotDot,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.textPrimary,
    marginTop: 2,
  },
  allLink: { fontSize: 13, fontWeight: '600', color: colors.primary },

  pile: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pileMore: {
    marginLeft: -12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 1,
  },
  pileMoreText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },

  editorialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  rowIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    width: 24,
    fontVariant: ['tabular-nums'],
  },
  rowCompany: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  rowMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: {
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },
  rowArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextUpSection: { paddingTop: 14 },
  nextUpHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  nextUpLabel: { fontSize: 11, fontWeight: '700', color: colors.accent, letterSpacing: 1.2 },
  nextUpBody: {
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  nextUpStrong: { fontWeight: '700' },
  nextUpCompany: { color: colors.primary, fontWeight: '700' },

  welcomeEmpty: { alignItems: 'center', paddingTop: 30, paddingHorizontal: 24 },
  welcomeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: { ...typography.title, color: colors.textPrimary, marginBottom: 6 },
  welcomeBody: { ...typography.secondary, textAlign: 'center', marginBottom: 16 },
  welcomeCta: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  welcomeCtaText: { color: colors.surface, fontWeight: '700', fontSize: 14 },

  emptyEventTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  emptyEventBody: { ...typography.tertiary, marginTop: 2 },
});
