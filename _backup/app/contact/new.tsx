import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import * as ImagePicker from 'expo-image-picker';
import { InterestPicker } from '../../src/components/InterestPicker';
import { useActiveEvent } from '../../src/hooks/useActiveEvent';
import { createContact } from '../../src/db/contacts';
import { addPhoto } from '../../src/db/photos';
import { colors, radius, shadow, typography, type InterestLevel } from '../../src/theme';

export default function NewContactScreen() {
  const router = useRouter();
  const { event: activeEvent } = useActiveEvent();
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

  async function onSave() {
    if (!companyName.trim()) {
      Alert.alert('Company name required', 'Add at least a company name to save.');
      return;
    }
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
        date_met: activeEvent?.start_date,
      });
      if (pendingPhotoUri) {
        await addPhoto(id, 'business_card', pendingPhotoUri);
      }
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.headerClose}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>New Contact</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.banner}>
          <Text style={styles.bannerText} numberOfLines={1}>
            📍 {activeEvent ? activeEvent.name : 'No active event'}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
            <Text style={styles.cardBtnLabel}>
              {pendingPhotoUri ? '✓ Business card captured · Retake' : '📷  Scan Business Card'}
            </Text>
          </Pressable>

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

          <Pressable
            onPress={() => void onSave()}
            disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          >
            <Text style={styles.saveLabel}>SAVE</Text>
          </Pressable>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerClose: { fontSize: 22, color: colors.textPrimary, width: 28 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  banner: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bannerText: { fontSize: 13, color: colors.textSecondary },
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
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  cardBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.card,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  cardBtnLabel: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  disclosure: { paddingVertical: 8, marginBottom: 8 },
  disclosureLabel: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...shadow.card,
  },
  saveLabel: { color: colors.surface, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});
