import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { DateField } from '../../../src/components/DateField';
import { InterestPicker } from '../../../src/components/InterestPicker';
import { TagChip } from '../../../src/components/TagChip';
import { getContact, updateContact } from '../../../src/db/contacts';
import { listEvents, type EventWithCount } from '../../../src/db/events';
import { listTags, setContactTags, tagsForContact, MAX_TAGS_PER_CONTACT, type TagRow } from '../../../src/db/tags';
import { colors, radius, elevation, typography, type InterestLevel } from '../../../src/theme';

export default function EditContactScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [whatTheySell, setWhatTheySell] = useState('');
  const [notes, setNotes] = useState('');
  const [interest, setInterest] = useState<InterestLevel>('warm');
  const [eventId, setEventId] = useState<number | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [allTags, setAllTags] = useState<TagRow[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [events, setEvents] = useState<EventWithCount[]>([]);

  const load = useCallback(async () => {
    const c = await getContact(id);
    if (!c) {
      router.back();
      return;
    }
    setCompanyName(c.company_name);
    setContactName(c.contact_name ?? '');
    setRole(c.role ?? '');
    setPhone(c.phone ?? '');
    setEmail(c.email ?? '');
    setWebsite(c.website ?? '');
    setWhatTheySell(c.what_they_sell ?? '');
    setNotes(c.notes ?? '');
    setInterest((c.interest_level ?? 'warm') as InterestLevel);
    setEventId(c.event_id);
    setFollowUpDate(c.follow_up_date ?? '');
    setFollowUpNotes(c.follow_up_notes ?? '');
    setAllTags(await listTags());
    setEvents(await listEvents());
    setSelectedTagIds((await tagsForContact(id)).map((t) => t.id));
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave() {
    if (!companyName.trim()) {
      Alert.alert('Company name required');
      return;
    }
    try {
      await updateContact(id, {
        company_name: companyName,
        contact_name: contactName.trim() || null,
        role: role.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        what_they_sell: whatTheySell.trim() || null,
        notes: notes.trim() || null,
        interest_level: interest,
        event_id: eventId,
        follow_up_date: followUpDate.trim() || null,
        follow_up_notes: followUpNotes.trim() || null,
      });
      await setContactTags(id, selectedTagIds);
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
    }
  }

  function toggleTag(tagId: number) {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) return prev.filter((x) => x !== tagId);
      if (prev.length >= MAX_TAGS_PER_CONTACT) {
        Alert.alert(
          'Tag limit reached',
          `A contact can have at most ${MAX_TAGS_PER_CONTACT} tags. Remove one to add another.`,
        );
        return prev;
      }
      return [...prev, tagId];
    });
  }

  if (loading) return <Screen style={styles.flex}><View /></Screen>;

  return (
    <Screen style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Contact</Text>
          <Pressable onPress={() => void onSave()} hitSlop={10}>
            <Text style={[styles.headerAction, { fontWeight: '700' }]}>Save</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Field label="Company Name *">
            <TextInput value={companyName} onChangeText={setCompanyName} style={styles.input} autoCapitalize="words" />
          </Field>
          <Field label="Contact Name">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={contactName} onChangeText={setContactName} style={[styles.input, { flex: 2 }]} autoCapitalize="words" />
              <TextInput value={role} onChangeText={setRole} placeholder="Role" placeholderTextColor={colors.textSecondary} style={[styles.input, { flex: 1 }]} autoCapitalize="words" />
            </View>
          </Field>
          <Field label="Interest"><InterestPicker value={interest} onChange={setInterest} /></Field>
          <Field label="Phone"><TextInput value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" /></Field>
          <Field label="Email"><TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" /></Field>
          <Field label="Website"><TextInput value={website} onChangeText={setWebsite} style={styles.input} keyboardType="url" autoCapitalize="none" /></Field>
          <Field label="What They Sell"><TextInput value={whatTheySell} onChangeText={setWhatTheySell} style={styles.input} /></Field>
          <Field label="Notes">
            <TextInput value={notes} onChangeText={setNotes} style={[styles.input, styles.multiline]} multiline />
          </Field>

          <Field label="Event">
            <View style={styles.eventList}>
              <Pressable onPress={() => setEventId(null)} style={[styles.eventChip, eventId === null && styles.eventChipActive]}>
                <Text style={[styles.eventChipText, eventId === null && styles.eventChipTextActive]}>None</Text>
              </Pressable>
              {events.map((e) => (
                <Pressable key={e.id} onPress={() => setEventId(e.id)} style={[styles.eventChip, eventId === e.id && styles.eventChipActive]}>
                  <Text style={[styles.eventChipText, eventId === e.id && styles.eventChipTextActive]}>{e.name}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label={`Tags (${selectedTagIds.length}/${MAX_TAGS_PER_CONTACT})`}>
            <View style={styles.tagWrap}>
              {allTags.length === 0 && <Text style={styles.muted}>No tags yet — create some in Settings.</Text>}
              {allTags.map((t) => {
                const selected = selectedTagIds.includes(t.id);
                const atLimit = !selected && selectedTagIds.length >= MAX_TAGS_PER_CONTACT;
                return (
                  <View key={t.id} style={atLimit ? { opacity: 0.4 } : undefined}>
                    <TagChip
                      label={t.name}
                      color={t.color}
                      selected={selected}
                      onPress={() => toggleTag(t.id)}
                    />
                  </View>
                );
              })}
            </View>
          </Field>

          <Field label="Follow-up Date">
            <DateField
              value={followUpDate || null}
              onChange={(v) => setFollowUpDate(v ?? '')}
              mode="date"
              placeholder="Pick a date"
              optional
              minimumDate={new Date()}
            />
          </Field>
          <Field label="Follow-up Notes">
            <TextInput value={followUpNotes} onChangeText={setFollowUpNotes} style={[styles.input, styles.multiline]} multiline />
          </Field>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[typography.sectionLabel, { marginBottom: 6 }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  headerAction: { fontSize: 16, color: colors.primary },
  scroll: { padding: 16, paddingBottom: 60 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  eventList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  eventChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  eventChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  eventChipText: { fontSize: 13, color: colors.textPrimary },
  eventChipTextActive: { color: colors.surface, fontWeight: '700' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muted: { ...typography.secondary },
});
