import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, typography } from '../theme';
import type { ContactListItem } from '../db/contacts';
import { InterestBadge } from './InterestBadge';

type Props = {
  contact: ContactListItem;
  onPress: () => void;
  subtitleOverride?: string;
};

export function ContactCard({ contact, onPress, subtitleOverride }: Props) {
  const tags = (contact.tag_names ?? '').split('|').filter(Boolean);
  const visibleTags = tags.slice(0, 2);
  const overflow = tags.length - visibleTags.length;
  const isIncomplete = contact.is_complete === 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <InterestBadge level={contact.interest_level} size="md" />
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={styles.company} numberOfLines={1}>
              {contact.company_name || '(no name saved)'}
            </Text>
            {isIncomplete && <View style={styles.incompleteDot} />}
          </View>
          {!!(contact.contact_name || contact.role) && (
            <Text style={styles.secondary} numberOfLines={1}>
              {[contact.contact_name, contact.role].filter(Boolean).join(' · ')}
            </Text>
          )}
          <Text style={styles.secondary} numberOfLines={1}>
            {subtitleOverride ?? contact.event_name ?? 'No event'}
          </Text>
          {visibleTags.length > 0 && (
            <View style={styles.tagRow}>
              {visibleTags.map((t) => (
                <View key={t} style={styles.tagPill}>
                  <Text style={styles.tagText} numberOfLines={1}>
                    {t}
                  </Text>
                </View>
              ))}
              {overflow > 0 && (
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>+{overflow}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  pressed: { opacity: 0.7 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  company: { ...typography.companyList, color: colors.textPrimary, flex: 1 },
  incompleteDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginLeft: 8,
  },
  secondary: { ...typography.secondary, marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  tagPill: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
});
