import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import QRCode from 'react-native-qrcode-svg';
import { Screen } from '../../src/components/Screen';
import { Icon } from '../../src/components/Icon';
import { getMyCard, saveMyCard, toVCard, isMyCardFilled, type MyCard } from '../../src/db/myCard';
import { colors, elevation, radius, typography } from '../../src/theme';
import { success, warning } from '../../src/utils/haptics';

const PHOTOS_DIR = 'my_card';

export default function MyCardScreen() {
  const router = useRouter();
  const [card, setCard] = useState<MyCard | null>(null);
  const [showQR, setShowQR] = useState(false);

  const load = useCallback(async () => {
    const c = await getMyCard();
    setCard(c);
    setShowQR(isMyCardFilled(c));
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (!card) return <Screen style={styles.flex}><View /></Screen>;

  function patch<K extends keyof MyCard>(key: K, value: MyCard[K]) {
    setCard((c) => (c ? { ...c, [key]: value } : c));
  }

  async function pickPhoto(source: 'camera' | 'library') {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please enable access in Settings.');
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] });
    if (result.canceled || result.assets.length === 0) return;

    const dir = `${FileSystem.documentDirectory}${PHOTOS_DIR}`;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const ext = result.assets[0].uri.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const filename = `my_card_${Date.now()}.${ext.slice(0, 5)}`;
    const dest = `${dir}/${filename}`;
    await FileSystem.copyAsync({ from: result.assets[0].uri, to: dest });
    if (card?.photo_path) {
      await FileSystem.deleteAsync(`${FileSystem.documentDirectory}${card.photo_path}`, { idempotent: true });
    }
    patch('photo_path', `${PHOTOS_DIR}/${filename}`);
  }

  function promptPhoto() {
    Alert.alert('Business card photo', 'Add a photo of your business card', [
      { text: 'Take Photo', onPress: () => void pickPhoto('camera') },
      { text: 'Choose from Library', onPress: () => void pickPhoto('library') },
      ...(card?.photo_path ? [{ text: 'Remove', style: 'destructive' as const, onPress: () => patch('photo_path', null) }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function onSave() {
    if (!card) return;
    if (!card.name.trim() && !card.email.trim() && !card.phone.trim()) {
      warning();
      Alert.alert('Add at least one detail', 'Please fill in a name, email or phone.');
      return;
    }
    await saveMyCard(card);
    success();
    setShowQR(true);
  }

  const vcard = toVCard(card);
  const filled = isMyCardFilled(card);
  const photoUri = card.photo_path ? `${FileSystem.documentDirectory}${card.photo_path}` : null;

  return (
    <Screen style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.headerAction}>Done</Text>
          </Pressable>
          <Text style={styles.headerTitle}>My Card</Text>
          <Pressable onPress={() => void onSave()} hitSlop={10}>
            <Text style={[styles.headerAction, { fontWeight: '700' }]}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {showQR && filled ? (
            <View style={styles.qrCard}>
              <Text style={styles.qrLabel}>SCAN TO SAVE MY DETAILS</Text>
              <View style={styles.qrBox}>
                <QRCode
                  value={vcard}
                  size={210}
                  color={colors.textPrimary}
                  backgroundColor={colors.surface}
                />
              </View>
              <Text style={styles.qrName}>{card.name || 'Your name'}</Text>
              {(card.role || card.company) && (
                <Text style={styles.qrRole}>
                  {[card.role, card.company].filter(Boolean).join(' · ')}
                </Text>
              )}
              <Pressable onPress={() => setShowQR(false)} style={styles.qrEditBtn} hitSlop={6}>
                <Icon name="create-outline" size={14} color={colors.primary} />
                <Text style={styles.qrEditText}>Edit my details</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.intro}>
                Fill out your details. Other Glean users can scan your QR code to save them instantly.
              </Text>

              <Pressable onPress={promptPhoto} style={styles.photoBlock}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : (
                  <View style={styles.photoEmpty}>
                    <Icon name="camera-outline" size={28} color={colors.textSecondary} />
                    <Text style={styles.photoLabel}>Add business card photo</Text>
                    <Text style={styles.photoHint}>Optional — camera or library</Text>
                  </View>
                )}
              </Pressable>

              <Field label="Full Name *">
                <TextInput
                  value={card.name}
                  onChangeText={(v) => patch('name', v)}
                  style={styles.input}
                  placeholder="Jane Doe"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </Field>
              <Field label="Role / Title">
                <TextInput
                  value={card.role}
                  onChangeText={(v) => patch('role', v)}
                  style={styles.input}
                  placeholder="Head of Sales"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </Field>
              <Field label="Company">
                <TextInput
                  value={card.company}
                  onChangeText={(v) => patch('company', v)}
                  style={styles.input}
                  placeholder="Acme Corp"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </Field>
              <Field label="Phone">
                <TextInput
                  value={card.phone}
                  onChangeText={(v) => patch('phone', v)}
                  style={styles.input}
                  placeholder="+1 555 0100"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </Field>
              <Field label="Email">
                <TextInput
                  value={card.email}
                  onChangeText={(v) => patch('email', v)}
                  style={styles.input}
                  placeholder="jane@acme.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Field>
              <Field label="Website">
                <TextInput
                  value={card.website}
                  onChangeText={(v) => patch('website', v)}
                  style={styles.input}
                  placeholder="acme.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </Field>
              <Field label="Notes">
                <TextInput
                  value={card.notes}
                  onChangeText={(v) => patch('notes', v)}
                  style={[styles.input, styles.multiline]}
                  placeholder="One line about you"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </Field>
            </>
          )}
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
  intro: { ...typography.callout, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  photoBlock: { marginBottom: 16 },
  photo: { width: '100%', height: 160, borderRadius: radius.card, backgroundColor: colors.surface },
  photoEmpty: {
    height: 120,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoLabel: { ...typography.bodyStrong, color: colors.textPrimary, marginTop: 6 },
  photoHint: { ...typography.tertiary },
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
  qrCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...elevation.card,
  },
  qrLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, marginBottom: 16 },
  qrBox: {
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  qrName: { ...typography.title, color: colors.textPrimary, marginTop: 16 },
  qrRole: { ...typography.callout, color: colors.textSecondary, marginTop: 2 },
  qrEditBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  qrEditText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});
