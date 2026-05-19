import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { FAB } from '../../src/components/FAB';
import { Icon, type IconName } from '../../src/components/Icon';
import { ContactCard } from '../../src/components/ContactCard';
import { useDashboard } from '../../src/hooks/useDashboard';
import { colors, elevation, radius, typography, interestMeta } from '../../src/theme';
import { formatDate } from '../../src/utils/format';

export default function DashboardScreen() {
  const router = useRouter();
  const { stats } = useDashboard();

  return (
    <Screen style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.subtitle}>Here's your field activity</Text>
        </View>

        {stats.activeEvent ? (
          <Pressable
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: stats.activeEvent!.id } })}
            style={styles.activeCard}
          >
            <View style={styles.activeRow}>
              <View style={styles.pulse} />
              <Text style={styles.activeLabel}>ACTIVE EVENT</Text>
            </View>
            <Text style={styles.activeName} numberOfLines={1}>{stats.activeEvent.name}</Text>
            <Text style={styles.activeMeta}>
              {stats.activeEventContacts} {stats.activeEventContacts === 1 ? 'contact' : 'contacts'} captured
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/(tabs)/events')} style={styles.activeCardEmpty}>
            <Icon name="calendar-outline" size={20} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeEmptyTitle}>No active event</Text>
              <Text style={styles.activeEmptyBody}>Pick one before capturing</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        )}

        <View style={styles.statsGrid}>
          <StatTile
            icon="people"
            color={colors.primary}
            tint={colors.primarySoft}
            value={stats.totalContacts}
            label="Total contacts"
            onPress={() => router.push('/(tabs)')}
          />
          <StatTile
            icon="flame"
            color={interestMeta.hot.dot}
            tint={interestMeta.hot.tint}
            value={stats.hotCount}
            label="Hot leads"
            onPress={() => router.push('/(tabs)')}
          />
          <StatTile
            icon="time-outline"
            color={colors.primary}
            tint={colors.primarySoft}
            value={stats.thisWeek}
            label="This week"
            onPress={() => router.push('/(tabs)')}
          />
          <StatTile
            icon="create-outline"
            color={colors.accent}
            tint={colors.warmTint}
            value={stats.draftCount}
            label="Drafts"
            onPress={() => router.push('/(tabs)/incomplete')}
          />
        </View>

        {stats.nextFollowUp && (
          <View style={styles.followUpCard}>
            <View style={styles.followUpHeader}>
              <Icon name="alarm-outline" size={16} color={colors.accent} />
              <Text style={styles.followUpLabel}>NEXT FOLLOW-UP</Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: '/contact/[id]', params: { id: stats.nextFollowUp!.id } })}
              style={styles.followUpBody}
            >
              <Text style={styles.followUpCompany}>{stats.nextFollowUp.company_name}</Text>
              {stats.nextFollowUp.contact_name && (
                <Text style={styles.followUpContact}>{stats.nextFollowUp.contact_name}</Text>
              )}
              <Text style={styles.followUpDate}>
                {formatDate(stats.nextFollowUp.follow_up_date)}
                {stats.nextFollowUp.follow_up_notes ? ` — ${stats.nextFollowUp.follow_up_notes}` : ''}
              </Text>
            </Pressable>
          </View>
        )}

        {stats.recent.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={typography.sectionLabel}>Recent contacts</Text>
              <Pressable onPress={() => router.push('/(tabs)')} hitSlop={6}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            {stats.recent.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onPress={() => router.push({ pathname: '/contact/[id]', params: { id: c.id } })}
              />
            ))}
          </View>
        )}

        {stats.totalContacts === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="sparkles" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Welcome to Glean</Text>
            <Text style={styles.emptyBody}>
              Create an event, then start capturing companies you meet at the booth.
            </Text>
            <Pressable
              onPress={() => router.push('/event/new')}
              style={styles.emptyCta}
            >
              <Text style={styles.emptyCtaText}>Create your first event</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <FAB onPress={() => router.push('/contact/new')} />
    </Screen>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function StatTile({
  icon, color, tint, value, label, onPress,
}: {
  icon: IconName; color: string; tint: string; value: number; label: string; onPress?: () => void;
}) {
  const Inner = (
    <View style={[styles.tile, { backgroundColor: colors.surface }]}>
      <View style={[styles.tileIcon, { backgroundColor: tint }]}>
        <Icon name={icon} size={16} color={color} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress} style={{ flex: 1 }}>{Inner}</Pressable> : <View style={{ flex: 1 }}>{Inner}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 80 },
  headerRow: { marginBottom: 14, marginTop: 4 },
  greeting: { ...typography.largeTitle, color: colors.textPrimary },
  subtitle: { ...typography.secondary, marginTop: 2 },

  activeCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 14,
    ...elevation.card,
  },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9DE0AD' },
  activeLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 1.2 },
  activeName: { ...typography.title, color: colors.surface, marginTop: 6 },
  activeMeta: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  activeCardEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeEmptyTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  activeEmptyBody: { ...typography.tertiary, marginTop: 2 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  tile: {
    flex: 1,
    minWidth: '47%',
    borderRadius: radius.card,
    padding: 14,
    gap: 8,
    ...elevation.card,
  },
  tileIcon: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  tileValue: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  tileLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },

  followUpCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 14,
    ...elevation.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  followUpHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  followUpLabel: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 1 },
  followUpBody: {},
  followUpCompany: { ...typography.headline, color: colors.textPrimary },
  followUpContact: { ...typography.callout, color: colors.textSecondary, marginTop: 2 },
  followUpDate: { ...typography.caption, color: colors.textSecondary, marginTop: 6, fontWeight: '500' },

  recentSection: { marginTop: 4 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  seeAll: { fontSize: 13, fontWeight: '600', color: colors.primary },

  empty: { alignItems: 'center', paddingTop: 30, paddingHorizontal: 24 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { ...typography.title, color: colors.textPrimary, marginBottom: 6 },
  emptyBody: { ...typography.secondary, textAlign: 'center', marginBottom: 16 },
  emptyCta: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  emptyCtaText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
});
