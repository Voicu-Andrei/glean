import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius } from '../theme';
import type { InterestLevel } from '../theme';
import { listEvents, type EventWithCount } from '../db/events';
import { listTags, type TagRow } from '../db/tags';

export type SortKey = 'date_met_desc' | 'company_asc' | 'interest';

export type FilterState = {
  eventId: number | null;
  interest: InterestLevel | null;
  tagIds: number[];
  sort: SortKey;
};

const SORT_LABELS: Record<SortKey, string> = {
  date_met_desc: 'Recent first',
  company_asc: 'Company A→Z',
  interest: 'By interest',
};

const INTERESTS: { value: InterestLevel; label: string }[] = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];

type Props = {
  state: FilterState;
  onChange: (s: FilterState) => void;
};

export function FilterBar({ state, onChange }: Props) {
  const [open, setOpen] = useState<'event' | 'interest' | 'tags' | 'sort' | null>(null);
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);

  useEffect(() => {
    void listEvents().then(setEvents);
    void listTags().then(setTags);
  }, [open]);

  const eventLabel =
    state.eventId == null ? 'All Events' : events.find((e) => e.id === state.eventId)?.name ?? 'Event';
  const interestLabel = state.interest ? INTERESTS.find((i) => i.value === state.interest)?.label : 'Interest';
  const tagsLabel = state.tagIds.length === 0 ? 'Tags' : `Tags (${state.tagIds.length})`;
  const sortLabel = SORT_LABELS[state.sort];

  function toggleTag(id: number) {
    onChange({
      ...state,
      tagIds: state.tagIds.includes(id) ? state.tagIds.filter((x) => x !== id) : [...state.tagIds, id],
    });
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Chip
          label={eventLabel}
          active={state.eventId != null}
          onPress={() => setOpen('event')}
        />
        <Chip
          label={interestLabel ?? 'Interest'}
          active={state.interest != null}
          onPress={() => setOpen('interest')}
        />
        <Chip
          label={tagsLabel}
          active={state.tagIds.length > 0}
          onPress={() => setOpen('tags')}
        />
        <Chip label={sortLabel} active={false} onPress={() => setOpen('sort')} />
      </ScrollView>

      <Sheet visible={open === 'event'} title="Event" onClose={() => setOpen(null)}>
        <PickerRow
          label="All Events"
          selected={state.eventId == null}
          onPress={() => {
            onChange({ ...state, eventId: null });
            setOpen(null);
          }}
        />
        {events.map((e) => (
          <PickerRow
            key={e.id}
            label={`${e.name} (${e.contact_count})`}
            selected={state.eventId === e.id}
            onPress={() => {
              onChange({ ...state, eventId: e.id });
              setOpen(null);
            }}
          />
        ))}
      </Sheet>

      <Sheet visible={open === 'interest'} title="Interest" onClose={() => setOpen(null)}>
        <PickerRow
          label="Any"
          selected={state.interest == null}
          onPress={() => {
            onChange({ ...state, interest: null });
            setOpen(null);
          }}
        />
        {INTERESTS.map((i) => (
          <PickerRow
            key={i.value}
            label={i.label}
            selected={state.interest === i.value}
            onPress={() => {
              onChange({ ...state, interest: i.value });
              setOpen(null);
            }}
          />
        ))}
      </Sheet>

      <Sheet visible={open === 'tags'} title="Tags" onClose={() => setOpen(null)}>
        {tags.length === 0 && (
          <Text style={styles.empty}>No tags yet. Create some in Settings.</Text>
        )}
        {tags.map((t) => (
          <PickerRow
            key={t.id}
            label={t.name}
            selected={state.tagIds.includes(t.id)}
            onPress={() => toggleTag(t.id)}
          />
        ))}
        <Pressable
          onPress={() => {
            onChange({ ...state, tagIds: [] });
            setOpen(null);
          }}
          style={styles.clearBtn}
        >
          <Text style={styles.clearText}>Clear all</Text>
        </Pressable>
      </Sheet>

      <Sheet visible={open === 'sort'} title="Sort" onClose={() => setOpen(null)}>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
          <PickerRow
            key={k}
            label={SORT_LABELS[k]}
            selected={state.sort === k}
            onPress={() => {
              onChange({ ...state, sort: k });
              setOpen(null);
            }}
          />
        ))}
      </Sheet>
    </>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.chevron, active && styles.chipLabelActive]}>▾</Text>
    </Pressable>
  );
}

function Sheet({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 400 }}>{children}</ScrollView>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PickerRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.pickerRow}>
      <Text style={[styles.pickerLabel, selected && { color: colors.primary, fontWeight: '700' }]}>
        {label}
      </Text>
      {selected && <Text style={styles.check}>✓</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, paddingHorizontal: 14, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipLabel: { fontSize: 11, fontWeight: '500', color: colors.textPrimary },
  chipLabelActive: { color: colors.surface },
  chevron: { fontSize: 9, color: colors.textSecondary },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.background,
  },
  pickerLabel: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  check: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  closeBtn: {
    marginTop: 12,
    padding: 14,
    alignItems: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.primary,
  },
  closeText: { color: colors.surface, fontWeight: '700', fontSize: 15 },
  clearBtn: { paddingVertical: 14, alignItems: 'center' },
  clearText: { color: colors.danger, fontWeight: '600' },
  empty: { paddingVertical: 24, textAlign: 'center', color: colors.textSecondary },
});
