import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, typography } from '../theme';
import type { EventRow } from '../db/events';
import { Icon } from './Icon';

type Props = {
  event: EventRow | null;
  /** Optional tap-handler override (default: route to Events tab). */
  onPress?: () => void;
};

function formatRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start) return '';
  const s = new Date(start);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (!end || end === start) return `${months[s.getMonth()]} ${s.getDate()}`;
  const e = new Date(end);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  }
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}`;
}

export function ActiveEventBanner({ event, onPress: onPressOverride }: Props) {
  const router = useRouter();
  const onPress = onPressOverride ?? (() => router.push('/(tabs)/events'));

  if (!event) {
    return (
      <Pressable onPress={onPress} style={[styles.banner, styles.bannerEmpty]}>
        <View style={styles.iconDim}>
          <Icon name="calendar-outline" size={16} color={colors.textSecondary} />
        </View>
        <View style={styles.body}>
          <Text style={styles.labelDim}>NOT ATTACHED TO AN EVENT</Text>
          <Text style={styles.textDim}>Tap to attach — or this contact will save unfiled</Text>
        </View>
        <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.banner}>
      <View style={styles.iconWrap}>
        <View style={styles.pulse} />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>ACTIVE EVENT</Text>
        <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
        {(event.location || event.start_date) && (
          <Text style={styles.meta} numberOfLines={1}>
            {[event.location, formatRange(event.start_date, event.end_date)].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>
      <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: radius.card,
    gap: 12,
  },
  bannerEmpty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconDim: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.backgroundSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  pulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#9DE0AD' },
  body: { flex: 1, gap: 1 },
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  eventName: { ...typography.headline, color: colors.surface, marginTop: 1 },
  meta: { ...typography.caption, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  labelDim: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, letterSpacing: 1 },
  textDim: { ...typography.callout, color: colors.textSecondary, marginTop: 2 },
});
