import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, elevation, typography, interestMeta } from '../theme';
import type { ContactListItem } from '../db/contacts';
import { Icon } from './Icon';

type Props = {
  contact: ContactListItem;
  onPress: () => void;
  subtitleOverride?: string;
};

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const day = 86_400_000;
  const days = Math.floor(diffMs / day);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + d.getDate();
}

export function ContactCard({ contact, onPress, subtitleOverride }: Props) {
  const tags = (contact.tag_names ?? '').split('|').filter(Boolean);
  const visibleTags = tags.slice(0, 2);
  const overflow = tags.length - visibleTags.length;
  const isIncomplete = contact.is_complete === 0;
  const meta = contact.interest_level ? interestMeta[contact.interest_level] : null;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  const onIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 8, tension: 120 }).start();
  const onOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 120 }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut} style={styles.cardOuter}>
        {meta && <View style={[styles.stripe, { backgroundColor: meta.edge }]} />}
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={styles.company} numberOfLines={1}>
              {contact.company_name || '(no name saved)'}
            </Text>
            {isIncomplete && (
              <View style={styles.incompletePill}>
                <Text style={styles.incompleteText}>NEEDS INFO</Text>
              </View>
            )}
          </View>

          {!!(contact.contact_name || contact.role) && (
            <Text style={styles.contactLine} numberOfLines={1}>
              {[contact.contact_name, contact.role].filter(Boolean).join(' · ')}
            </Text>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaInline}>
              <Icon name="calendar-outline" size={11} color={colors.textTertiary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {subtitleOverride ?? contact.event_name ?? 'No event'}
              </Text>
            </View>
            <Text style={styles.dateChip}>{relativeDate(contact.date_met)}</Text>
          </View>

          {visibleTags.length > 0 && (
            <View style={styles.tagRow}>
              {visibleTags.map((t) => (
                <View key={t} style={styles.tagPill}>
                  <Text style={styles.tagText} numberOfLines={1}>{t}</Text>
                </View>
              ))}
              {overflow > 0 && (
                <View style={[styles.tagPill, styles.tagOverflow]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>+{overflow}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    marginBottom: 10,
    overflow: 'hidden',
    ...elevation.card,
  },
  stripe: { width: 4, alignSelf: 'stretch' },
  body: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  company: { ...typography.companyList, color: colors.textPrimary, flex: 1 },
  incompletePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.warmTint,
    borderRadius: radius.xs,
  },
  incompleteText: { fontSize: 9, fontWeight: '700', color: colors.accent, letterSpacing: 0.5 },
  contactLine: { ...typography.body, color: colors.textSecondary, marginTop: 3 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  metaInline: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaText: { ...typography.tertiary, flex: 1 },
  dateChip: { ...typography.caption, color: colors.textTertiary, fontWeight: '500' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  tagPill: {
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tagOverflow: { backgroundColor: colors.primarySoft },
  tagText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.2 },
});
