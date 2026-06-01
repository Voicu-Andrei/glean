import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { DateField } from '../../src/components/DateField';
import { createEvent } from '../../src/db/events';
import { colors, radius, typography } from '../../src/theme';
import { todayIso } from '../../src/utils/format';
import { success, warning } from '../../src/utils/haptics';

export default function NewEventScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<string | null>(`${todayIso()}T09:00`);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [setActive, setSetActive] = useState(true);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!name.trim()) {
      warning();
      Alert.alert('Name required', 'Please give this event a name.');
      return;
    }
    if (!startDate) {
      warning();
      Alert.alert('Start date required');
      return;
    }
    setSaving(true);
    try {
      await createEvent({
        name: name.trim(),
        location: location.trim() || null,
        start_date: startDate,
        end_date: endDate ?? null,
        notes: notes.trim() || null,
        set_active: setActive,
      });
      success();
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
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>New Event</Text>
          <Pressable onPress={() => void onSave()} disabled={saving} hitSlop={10}>
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
          <Field label="Name *">
            <TextInput value={name} onChangeText={setName} style={styles.input} autoCapitalize="words" autoFocus />
          </Field>
          <Field label="Location">
            <TextInput value={location} onChangeText={setLocation} style={styles.input} placeholder="Paris" placeholderTextColor={colors.textSecondary} autoCapitalize="words" />
          </Field>
          <Field label="Starts *">
            <DateField
              value={startDate}
              onChange={(v) => {
                setStartDate(v);
                // Prefill end as same-day (single-day event) when first picking
                // a start. User can extend to multi-day or clear via the picker.
                if (v && !endDate) setEndDate(v);
              }}
              mode="datetime"
              placeholder="Pick a date & time"
            />
          </Field>
          <Field label="Ends">
            <DateField value={endDate} onChange={setEndDate} mode="datetime" placeholder="Same day" optional />
          </Field>
          <Field label="Notes">
            <TextInput value={notes} onChangeText={setNotes} style={[styles.input, styles.multiline]} multiline />
          </Field>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Set as Active Event</Text>
              <Text style={styles.toggleHint}>New contacts will auto-attach to this event.</Text>
            </View>
            <Switch
              value={setActive}
              onValueChange={setSetActive}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.card,
    marginTop: 4,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  toggleHint: { ...typography.secondary, marginTop: 2 },
});
