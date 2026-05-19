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
import { Icon } from './Icon';

export type SortKey = 'date_met_desc' | 'company_asc' | 'interest';

export type FilterState = {
  eventId: number | null;
  interest: InterestLevel | null;
  tagIds: number[];
  sort: SortKey;
};

const SORT_LABELS: Record<SortKey, string> = {
  date_met_desc: 'Recent',
  company_asc: 'A → Z',
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
  const [open, setOpen] = useState<'filter' | 'sort' | null>(null);
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);

  useEffect(() => {
    void listEvents().then(setEvents);
    void listTags().then(setTags);
  }, [open]);

  const activeCount =
    (state.eventId !== null ? 1 : 0) +
    (state.interest !== null ? 1 : 0) +
    state.tagIds.length;

  function clearAll() {
    onChange({ eventId: null, interest: null, tagIds: [], sort: state.sort });
  }

  function toggleTag(id: number) {
    onChange({
      ...state,
      tagIds: state.tagIds.includes(id) ? state.tagIds.filter((x) => x !== id) : [...state.tagIds, id],
    });
  }

  return (
    <>
      <View style={styles.row}>
        <Pressable
          onPress={() => setOpen('filter')}
          style={[styles.btn, activeCount > 0 && styles.btnActive]}
          hitSlop={6}
        >
          <Icon
            name="options-outline"
            size={14}
            color={activeCount > 0 ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.btnLabel, activeCount > 0 && styles.btnLabelActive]}>
            Filter
          </Text>
          {activeCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activeCount}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => setOpen('sort')}
          style={styles.btn}
          hitSlop={6}
        >
          <Icon name="swap-vertical-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.btnLabel}>{SORT_LABELS[state.sort]}</Text>
        </Pressable>

        {activeCount > 0 && (
          <Pressable onPress={clearAll} style={styles.clearInline} hitSlop={6}>
            <Text style={styles.clearInlineText}>Clear</Text>
          </Pressable>
        )}
      </View>

      <Sheet visible={open === 'filter'} title="Filter contacts" onClose={() => setOpen(null)}>
        <Group label="Event">
          <ChipRow>
            <SelectChip
              label="All"
              selected={state.eventId == null}
              onPress={() => onChange({ ...state, eventId: null })}
            />
            {events.map((e) => (
              <SelectChip
                key={e.id}
                label={`${e.name} (${e.contact_count})`}
                selected={state.eventId === e.id}
                onPress={() => onChange({ ...state, eventId: e.id })}
              />
            ))}
          </ChipRow>
        </Group>

        <Group label="Interest">
          <ChipRow>
            <SelectChip
              label="Any"
              selected={state.interest == null}
              onPress={() => onChange({ ...state, interest: null })}
            />
            {INTERESTS.map((i) => (
              <SelectChip
                key={i.value}
                label={i.label}
                selected={state.interest === i.value}
                onPress={() => onChange({ ...state, interest: i.value })}
              />
            ))}
          </ChipRow>
        </Group>

        <Group label="Tags">
          {tags.length === 0 ? (
            <Text style={styles.empty}>No tags yet. Create some in Settings.</Text>
          ) : (
            <ChipRow>
              {tags.map((t) => (
                <SelectChip
                  key={t.id}
                  label={t.name}
                  selected={state.tagIds.includes(t.id)}
                  onPress={() => toggleTag(t.id)}
                />
              ))}
            </ChipRow>
          )}
        </Group>

        {activeCount > 0 && (
          <Pressable onPress={clearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear all filters</Text>
          </Pressable>
        )}
      </Sheet>

      <Sheet visible={open === 'sort'} title="Sort by" onClose={() => setOpen(null)}>
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
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 520 }}>{children}</ScrollView>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.groupLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

function SelectChip({
  label,
  selected,
  onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.selectChip, selected && styles.selectChipActive]}
    >
      <Text style={[styles.selectChipText, selected && styles.selectChipTextActive]}>{label}</Text>
    </Pressable>
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
      {selected && <Icon name="checkmark" size={18} color={colors.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  btnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  btnLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  btnLabelActive: { color: colors.primary },
  countBadge: {
    marginLeft: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 10, fontWeight: '700', color: colors.surface },
  clearInline: { marginLeft: 'auto', paddingHorizontal: 4, paddingVertical: 4 },
  clearInlineText: { fontSize: 12, fontWeight: '600', color: colors.danger },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 18,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 12,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  selectChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  selectChipTextActive: { color: colors.primary },

  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
  },
  pickerLabel: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.primary,
  },
  closeText: { color: colors.surface, fontWeight: '700', fontSize: 15 },
  clearBtn: { paddingVertical: 10, alignItems: 'center' },
  clearText: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  empty: { paddingVertical: 12, textAlign: 'center', color: colors.textSecondary, fontSize: 13 },
});
