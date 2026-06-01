import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import * as ImagePicker from 'expo-image-picker';
import { InterestPicker } from '../../src/components/InterestPicker';
import { ActiveEventBanner } from '../../src/components/ActiveEventBanner';
import { Icon } from '../../src/components/Icon';
import { useActiveEvent } from '../../src/hooks/useActiveEvent';
import { createContact } from '../../src/db/contacts';
import { addPhoto } from '../../src/db/photos';
import { listEvents, setActiveEvent, type EventWithCount } from '../../src/db/events';
import { colors, radius, elevation, typography, type InterestLevel } from '../../src/theme';
import { success, warning } from '../../src/utils/haptics';

export default function NewContactScreen() {
  const router = useRouter();
  const { event: activeEvent, reload: reloadActive } = useActiveEvent();
  const [eventSheet, setEventSheet] = useState(false);
  const [events, setEvents] = useState<EventWithCount[]>([]);
  useEffect(() => { void listEvents().then(setEvents); }, []);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [role, setRole] = useState('');
  const [interest, setInterest] = useState<InterestLevel>('warm');
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [whatTheySell, setWhatTheySell] = useState('');
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function captureCard() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Please enable camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || result.assets.length === 0) return;
    setPendingPhotoUri(result.assets[0].uri);
  }

  async function pickEvent(eventId: number | null) {
    await setActiveEvent(eventId);
    await reloadActive();
    setEvents(await listEvents());
    setEventSheet(false);
  }

  async function doSave() {
    setSaving(true);
    try {
      const id = await createContact({
        event_id: activeEvent?.id ?? null,
        company_name: companyName,
        contact_name: contactName.trim() || null,
        role: role.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        what_they_sell: whatTheySell.trim() || null,
        notes: note.trim() || null,
        interest_level: interest,
      });
      if (pendingPhotoUri) {
        await addPhoto(id, 'business_card', pendingPhotoUri);
      }
      success();
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onSave() {
    if (!companyName.trim()) {
      warning();
      Alert.alert('Company name required', 'Add at least a company name to save.');
      return;
    }
    if (!activeEvent) {
      Alert.alert(
        'Save without an event?',
        `${companyName.trim()} won't be attached to any event. You can attach it later from the contact's detail screen.`,
        [
          { text: 'Attach to event', onPress: () => setEventSheet(true) },
          { text: 'Save unfiled', style: 'destructive', onPress: () => void doSave() },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
    await doSave();
  }


  return (
    <Screen style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 56 }}>
            <Icon name="close" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>New Contact</Text>
          <Pressable onPress={() => void onSave()} disabled={saving} hitSlop={10} style={{ width: 56, alignItems: 'flex-end' }}>
            <Text style={[styles.headerSave, saving && { opacity: 0.5 }]}>Save</Text>
          </Pressable>
        </View>
        <ActiveEventBanner event={activeEvent} onPress={() => setEventSheet(true)} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <Field label="Company Name *">
            <TextInput
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Acme Corp"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              autoFocus
              autoCapitalize="words"
              returnKeyType="next"
            />
          </Field>

          <Field label="Contact Name">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={contactName}
                onChangeText={setContactName}
                placeholder="John Smith"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { flex: 2 }]}
                autoCapitalize="words"
              />
              <TextInput
                value={role}
                onChangeText={setRole}
                placeholder="Role"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { flex: 1 }]}
                autoCapitalize="words"
              />
            </View>
          </Field>

          <Field label="Interest">
            <InterestPicker value={interest} onChange={setInterest} />
          </Field>

          <Pressable onPress={() => void captureCard()} style={styles.cardBtn}>
            <Icon
              name={pendingPhotoUri ? 'checkmark-circle' : 'camera-outline'}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.cardBtnLabel}>
              {pendingPhotoUri ? 'Business card captured — retake' : 'Scan Business Card'}
            </Text>
          </Pressable>

          <Field label="Phone">
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 555 123 4567"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </Field>
          <Field label="Email">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="john@acme.com"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>

          <Field label="Quick Note">
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Interested in distribution..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.multiline]}
              multiline
              numberOfLines={3}
            />
          </Field>

          <Pressable onPress={() => setExpanded((e) => !e)} style={styles.disclosure}>
            <Text style={styles.disclosureLabel}>
              {expanded ? '− Hide details' : '+ Add more details'}
            </Text>
          </Pressable>

          {expanded && (
            <>
              <Field label="Website">
                <TextInput
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="acme.com"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </Field>
              <Field label="What They Sell">
                <TextInput
                  value={whatTheySell}
                  onChangeText={setWhatTheySell}
                  placeholder="B2B software, supply chain"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
              </Field>
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
        <View style={styles.saveBar}>
          <Pressable
            onPress={() => void onSave()}
            disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          >
            <Text style={styles.saveLabel}>Save Contact</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={eventSheet} transparent animationType="fade" onRequestClose={() => setEventSheet(false)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setEventSheet(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Attach to event</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              <Pressable
                onPress={() => void pickEvent(null)}
                style={styles.pickerRow}
              >
                <Text style={[styles.pickerLabel, !activeEvent && { color: colors.primary, fontWeight: '700' }]}>
                  No event
                </Text>
                {!activeEvent && <Icon name="checkmark" size={16} color={colors.primary} />}
              </Pressable>
              {events.map((e) => (
                <Pressable
                  key={e.id}
                  onPress={() => void pickEvent(e.id)}
                  style={styles.pickerRow}
                >
                  <Text
                    style={[styles.pickerLabel, activeEvent?.id === e.id && { color: colors.primary, fontWeight: '700' }]}
                    numberOfLines={1}
                  >
                    {e.name}
                  </Text>
                  <Text style={styles.pickerCount}>{e.contact_count}</Text>
                  {activeEvent?.id === e.id && <Icon name="checkmark" size={16} color={colors.primary} />}
                </Pressable>
              ))}
              <Pressable
                onPress={() => { setEventSheet(false); router.push('/event/new'); }}
                style={[styles.pickerRow, { borderBottomWidth: 0 }]}
              >
                <Icon name="add" size={16} color={colors.primary} />
                <Text style={[styles.pickerLabel, { color: colors.primary, fontWeight: '600' }]}>New event…</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  headerSave: { fontSize: 16, fontWeight: '700', color: colors.primary },
  scroll: { padding: 16, paddingTop: 14, paddingBottom: 240 },
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
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  cardBtn: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.card,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  cardBtnLabel: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  disclosure: { paddingVertical: 8, marginBottom: 8 },
  disclosureLabel: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  saveBar: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    paddingVertical: 15,
    alignItems: 'center',
    ...elevation.fab,
  },
  saveLabel: { color: colors.surface, fontSize: 16, fontWeight: '700' },

  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 10, paddingBottom: 28, paddingHorizontal: 18,
  },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.borderSoft,
  },
  pickerLabel: { flex: 1, fontSize: 15, color: colors.textPrimary },
  pickerCount: { fontSize: 12, fontWeight: '700', color: colors.textTertiary, fontVariant: ['tabular-nums'] },
});
