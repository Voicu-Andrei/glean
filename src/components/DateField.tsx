import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, typography } from '../theme';
import { Icon } from './Icon';

type Mode = 'date' | 'datetime';

type Props = {
  value: string | null;       // ISO 'YYYY-MM-DD' or full 'YYYY-MM-DDTHH:mm' for datetime
  onChange: (v: string | null) => void;
  mode?: Mode;
  placeholder?: string;
  optional?: boolean;
  minimumDate?: Date;
};

function pad(n: number): string { return n.toString().padStart(2, '0'); }

function toIso(d: Date, mode: Mode): string {
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (mode === 'date') return date;
  return `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromIso(s: string | null): Date {
  if (!s) return new Date();
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatDisplay(s: string | null, mode: Mode): string {
  if (!s) return '';
  const d = fromIso(s);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const base = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  if (mode === 'date') return base;
  return `${base} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateField({
  value, onChange, mode = 'date', placeholder = 'Pick a date', optional = false, minimumDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(fromIso(value));

  function openPicker() {
    setDraft(fromIso(value));
    setOpen(true);
  }

  function commit() {
    onChange(toIso(draft, mode));
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setOpen(false);
  }

  return (
    <>
      <Pressable onPress={openPicker} style={styles.field}>
        <Icon name="calendar-outline" size={16} color={colors.textSecondary} />
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>
          {value ? formatDisplay(value, mode) : placeholder}
        </Text>
        {value && optional && (
          <Pressable onPress={clear} hitSlop={8}>
            <Icon name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={styles.backdrop}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>
              {mode === 'datetime' ? 'Pick date & time' : 'Pick a date'}
            </Text>

            <DateTimePicker
              value={draft}
              mode={mode}
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, d) => { if (d) setDraft(d); }}
              minimumDate={minimumDate}
              accentColor={colors.primary}
              themeVariant="light"
            />

            <View style={styles.sheetActions}>
              {optional && value && (
                <Pressable onPress={clear} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Clear</Text>
                </Pressable>
              )}
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => setOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={commit} style={styles.doneBtn}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  fieldText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  fieldPlaceholder: { color: colors.textSecondary },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 12,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  clearBtn: { paddingVertical: 12, paddingHorizontal: 4 },
  clearBtnText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.pill },
  cancelText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  doneBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.pill, backgroundColor: colors.primary },
  doneText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
});
