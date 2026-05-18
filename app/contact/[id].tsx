import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { InterestBadge } from '../../src/components/InterestBadge';
import { PhotoStrip } from '../../src/components/PhotoStrip';
import { TagChip } from '../../src/components/TagChip';
import {
  cycleInterest,
  deleteContact,
  getContact,
  type ContactRow,
} from '../../src/db/contacts';
import { getEvent, type EventRow } from '../../src/db/events';
import { listPhotos, type PhotoRow } from '../../src/db/photos';
import { tagsForContact, type TagRow } from '../../src/db/tags';
import { colors, interestMeta, radius, elevation, typography } from '../../src/theme';
import { formatDate } from '../../src/utils/format';
import { select } from '../../src/utils/haptics';

export default function ContactDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const [contact, setContact] = useState<ContactRow | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);

  const reload = useCallback(async () => {
    const c = await getContact(id);
    setContact(c);
    if (c?.event_id) setEvent(await getEvent(c.event_id));
    else setEvent(null);
    setPhotos(await listPhotos(id));
    setTags(await tagsForContact(id));
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  if (!contact) {
    return (
      <Screen style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Contact not found.</Text>
        </View>
      </Screen>
    );
  }

  async function onInterest() {
    select();
    await cycleInterest(id);
    await reload();
  }

  function onDelete() {
    Alert.alert('Delete contact?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteContact(id);
          router.back();
        },
      },
    ]);
  }

  const interestLabel = contact.interest_level ? interestMeta[contact.interest_level].label.toUpperCase() : 'NO INTEREST';
  const subtitleParts = [event?.name, contact.date_met ? formatDate(contact.date_met) : null].filter(Boolean);

  return (
    <Screen style={styles.flex}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/contact/edit/[id]', params: { id } })}
          hitSlop={10}
        >
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => void onInterest()} style={styles.interestHeader}>
          <InterestBadge level={contact.interest_level} size="md" />
          <Text style={styles.interestLabel}>{interestLabel}</Text>
        </Pressable>
        <Text style={styles.company}>{contact.company_name}</Text>
        {subtitleParts.length > 0 && (
          <Text style={styles.subtitle}>{subtitleParts.join(' · ')}</Text>
        )}

        <Section title="Media">
          <PhotoStrip contactId={id} photos={photos} onChange={() => void reload()} />
        </Section>

        <Section title="Contact">
          {contact.contact_name || contact.role ? (
            <Row icon="👤" text={[contact.contact_name, contact.role].filter(Boolean).join(' · ')} />
          ) : (
            <Row icon="👤" text="No contact name" muted />
          )}
          {contact.phone && (
            <Row
              icon="📞"
              text={contact.phone}
              onPress={() => void Linking.openURL(`tel:${contact.phone}`)}
            />
          )}
          {contact.email && (
            <Row
              icon="✉️"
              text={contact.email}
              onPress={() => void Linking.openURL(`mailto:${contact.email}`)}
            />
          )}
        </Section>

        {(contact.website || contact.what_they_sell) && (
          <Section title="Company">
            {contact.website && (
              <Row
                icon="🌐"
                text={contact.website}
                onPress={() => {
                  const url = contact.website!.match(/^https?:\/\//)
                    ? contact.website!
                    : `https://${contact.website}`;
                  void Linking.openURL(url);
                }}
              />
            )}
            {contact.what_they_sell && <Row icon="🏷" text={contact.what_they_sell} />}
          </Section>
        )}

        {contact.notes && (
          <Section title="Notes">
            <Text style={styles.bodyText}>{contact.notes}</Text>
          </Section>
        )}

        <Section title="Tags">
          {tags.length === 0 ? (
            <Text style={styles.muted}>No tags. Edit to add.</Text>
          ) : (
            <View style={styles.tagRow}>
              {tags.map((t) => (
                <TagChip key={t.id} label={t.name} color={t.color} selected />
              ))}
            </View>
          )}
        </Section>

        {(contact.follow_up_date || contact.follow_up_notes) && (
          <Section title="Follow-up">
            <Text style={styles.bodyText}>
              {contact.follow_up_done ? '☑ ' : '☐ '}
              {contact.follow_up_date ? formatDate(contact.follow_up_date) : 'No date'}
            </Text>
            {contact.follow_up_notes && (
              <Text style={[styles.bodyText, { marginTop: 4 }]}>{contact.follow_up_notes}</Text>
            )}
          </Section>
        )}

        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Delete contact</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={typography.sectionLabel}>{title}</Text>
      <View style={{ marginTop: 8 }}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  text,
  onPress,
  muted,
}: {
  icon: string;
  text: string;
  onPress?: () => void;
  muted?: boolean;
}) {
  const inner = (
    <View style={styles.rowItem}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowText, muted && { color: colors.textSecondary }, onPress && { color: colors.primary }]}>
        {text}
      </Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  back: { fontSize: 16, color: colors.primary },
  edit: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 80 },
  interestHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  interestLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.5 },
  company: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  subtitle: { ...typography.secondary, marginTop: 4 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    marginTop: 16,
    ...elevation.card,
  },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  rowIcon: { fontSize: 16, width: 22 },
  rowText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  bodyText: { ...typography.body, color: colors.textPrimary },
  muted: { ...typography.secondary },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  deleteBtn: { marginTop: 28, padding: 14, alignItems: 'center' },
  deleteText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...typography.secondary },
});
