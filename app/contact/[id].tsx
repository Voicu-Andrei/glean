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
import { Icon, type IconName } from '../../src/components/Icon';
import { InterestPicker } from '../../src/components/InterestPicker';
import { PhotoStrip } from '../../src/components/PhotoStrip';
import { TagChip } from '../../src/components/TagChip';
import {
  deleteContact,
  getContact,
  updateContact,
  type ContactRow,
} from '../../src/db/contacts';
import type { InterestLevel } from '../../src/theme';
import { getEvent, type EventRow } from '../../src/db/events';
import { listPhotos, type PhotoRow } from '../../src/db/photos';
import { tagsForContact, type TagRow } from '../../src/db/tags';
import { colors, radius, elevation, typography } from '../../src/theme';
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
            <Icon name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Contact not found.</Text>
        </View>
      </Screen>
    );
  }

  async function onInterestChange(level: InterestLevel) {
    select();
    await updateContact(id, { interest_level: level });
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

  const subtitleParts = [event?.name, contact.date_met ? formatDate(contact.date_met) : null].filter(Boolean);

  const websiteUrl = contact.website
    ? (contact.website.match(/^https?:\/\//) ? contact.website : `https://${contact.website}`)
    : null;

  const actions = [
    contact.phone ? { icon: 'call' as IconName, label: 'Call', onPress: () => {
      // Strip everything except digits, +, *, # and pause/wait — what tel: accepts.
      const safe = contact.phone!.replace(/[^0-9+*#,;p]/gi, '');
      if (safe) void Linking.openURL(`tel:${safe}`);
    } } : null,
    contact.email ? { icon: 'mail' as IconName, label: 'Email', onPress: () => {
      void Linking.openURL(`mailto:${encodeURIComponent(contact.email!)}`);
    } } : null,
    websiteUrl ? { icon: 'globe-outline' as IconName, label: 'Web', onPress: () => void Linking.openURL(websiteUrl) } : null,
  ].filter(Boolean) as Array<{ icon: IconName; label: string; onPress: () => void }>;

  return (
    <Screen style={styles.flex}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backRow}>
          <Icon name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/contact/edit/[id]', params: { id } })}
          hitSlop={10}
        >
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.company}>{contact.company_name}</Text>
        {subtitleParts.length > 0 && (
          <Text style={styles.subtitle}>{subtitleParts.join(' · ')}</Text>
        )}

        <View style={styles.interestPickerWrap}>
          <InterestPicker
            value={contact.interest_level}
            onChange={(v) => void onInterestChange(v)}
          />
        </View>

        {actions.length > 0 && (
          <View style={styles.actionRow}>
            {actions.map((a) => (
              <Pressable key={a.label} onPress={a.onPress} style={styles.actionBtn}>
                <View style={styles.actionCircle}>
                  <Icon name={a.icon} size={20} color={colors.primary} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Section title="Media">
          <PhotoStrip contactId={id} photos={photos} onChange={() => void reload()} />
        </Section>

        {(contact.contact_name || contact.role || contact.phone || contact.email) && (
          <Section title="Contact">
            {(contact.contact_name || contact.role) && (
              <Row
                icon="person-outline"
                text={[contact.contact_name, contact.role].filter(Boolean).join(' · ')}
              />
            )}
            {contact.phone && (
              <Row icon="call-outline" text={contact.phone} />
            )}
            {contact.email && (
              <Row icon="mail-outline" text={contact.email} />
            )}
          </Section>
        )}

        {(contact.website || contact.what_they_sell) && (
          <Section title="Company">
            {contact.website && <Row icon="globe-outline" text={contact.website} />}
            {contact.what_they_sell && <Row icon="pricetag-outline" text={contact.what_they_sell} />}
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
          <Icon name="trash-outline" size={16} color={colors.danger} />
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
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}

function Row({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.rowItem}>
      <Icon name={icon} size={16} color={colors.textSecondary} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  edit: { fontSize: 16, color: colors.primary, fontWeight: '600', paddingHorizontal: 6 },
  scroll: { padding: 16, paddingBottom: 80 },
  interestPickerWrap: { marginTop: 14 },
  company: { ...typography.largeTitle, color: colors.textPrimary },
  subtitle: { ...typography.secondary, marginTop: 4 },
  actionRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 18,
    paddingHorizontal: 4,
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    marginTop: 16,
    ...elevation.card,
  },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  rowText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  bodyText: { ...typography.body, color: colors.textPrimary, lineHeight: 21 },
  muted: { ...typography.secondary },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  deleteBtn: {
    marginTop: 32,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...typography.secondary },
});
