import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Icon } from '../../src/components/Icon';
import {
  createTag,
  deleteTag,
  listTagsWithCount,
  renameTag,
  setTagColor,
  TAG_COLORS,
  type TagWithCount,
} from '../../src/db/tags';
import { colors, elevation, radius, typography } from '../../src/theme';

export default function TagsScreen() {
  const router = useRouter();
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLORS[0]);
  const [colorPickerFor, setColorPickerFor] = useState<TagWithCount | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const reload = useCallback(async () => {
    setTags(await listTagsWithCount());
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function onCreate() {
    const name = newTag.trim();
    if (!name) return;
    try {
      await createTag(name, newTagColor);
      setNewTag('');
      setNewTagColor(TAG_COLORS[0]);
      await reload();
    } catch {
      Alert.alert('Could not create tag', 'A tag with that name already exists.');
    }
  }

  async function onDelete(t: TagWithCount) {
    Alert.alert(
      `Delete "${t.name}"?`,
      t.contact_count > 0
        ? `This will remove the tag from ${t.contact_count} ${t.contact_count === 1 ? 'contact' : 'contacts'}.`
        : 'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => { await deleteTag(t.id); await reload(); },
        },
      ],
    );
  }

  async function onRenameSave() {
    if (renamingId == null) return;
    const name = renameDraft.trim();
    if (!name) { setRenamingId(null); return; }
    try { await renameTag(renamingId, name); }
    catch { Alert.alert('Could not rename', 'Another tag already uses that name.'); }
    setRenamingId(null); setRenameDraft(''); await reload();
  }

  async function applyColor(color: string) {
    if (!colorPickerFor) return;
    await setTagColor(colorPickerFor.id, color);
    setColorPickerFor(null);
    await reload();
  }

  return (
    <Screen style={styles.flex}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Icon name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage tags</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.addRow}>
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              placeholder="New tag name"
              placeholderTextColor={colors.textSecondary}
              style={styles.addInput}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => void onCreate()}
            />
            <Pressable onPress={() => void onCreate()} style={styles.addBtn}>
              <Text style={styles.addBtnLabel}>Add</Text>
            </Pressable>
          </View>
          <View style={styles.swatchRow}>
            {TAG_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setNewTagColor(c)}
                style={[styles.swatch, { backgroundColor: c }, newTagColor === c && styles.swatchSelected]}
                hitSlop={4}
              />
            ))}
          </View>
        </View>

        <View style={[styles.card, { marginTop: 12, padding: 0, overflow: 'hidden' }]}>
          {tags.length === 0 && (
            <Text style={styles.empty}>No tags yet — create one above.</Text>
          )}
          {tags.map((t, i) => (
            <View
              key={t.id}
              style={[styles.tagRow, i > 0 && { borderTopWidth: 1, borderColor: colors.borderSoft }]}
            >
              {renamingId === t.id ? (
                <TextInput
                  value={renameDraft}
                  onChangeText={setRenameDraft}
                  style={[styles.addInput, { flex: 1 }]}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => void onRenameSave()}
                  onBlur={() => void onRenameSave()}
                />
              ) : (
                <Pressable
                  onPress={() => { setRenamingId(t.id); setRenameDraft(t.name); }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                >
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); setColorPickerFor(t); }}
                    hitSlop={8}
                  >
                    <View style={[styles.tagDot, { backgroundColor: t.color }]} />
                  </Pressable>
                  <Text style={styles.tagLabel}>{t.name}</Text>
                  <Text style={styles.tagCount}>· {t.contact_count}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => void onDelete(t)} hitSlop={8}>
                <Icon name="trash-outline" size={16} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.hint}>
          Tap a tag's dot to change color. Tap the name to rename. Max 10 tags per contact.
        </Text>
      </ScrollView>

      <Modal
        visible={!!colorPickerFor}
        transparent
        animationType="fade"
        onRequestClose={() => setColorPickerFor(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setColorPickerFor(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              Color for "{colorPickerFor?.name ?? ''}"
            </Text>
            <View style={styles.colorGrid}>
              {TAG_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => void applyColor(c)}
                  style={[
                    styles.colorTile,
                    { backgroundColor: c },
                    colorPickerFor?.color === c && styles.colorTileSelected,
                  ]}
                />
              ))}
            </View>
            <Pressable onPress={() => setColorPickerFor(null)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  scroll: { padding: 16, paddingBottom: 60 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    ...elevation.card,
  },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 8 },
  addBtnLabel: { color: colors.surface, fontWeight: '700' },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: colors.textPrimary },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tagDot: { width: 14, height: 14, borderRadius: 7 },
  tagLabel: { fontSize: 15, color: colors.textPrimary },
  tagCount: { fontSize: 13, color: colors.textSecondary },
  empty: { textAlign: 'center', padding: 18, color: colors.textSecondary },
  hint: { ...typography.tertiary, color: colors.textSecondary, marginTop: 12, textAlign: 'center' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
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
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  colorTile: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: 'transparent' },
  colorTileSelected: { borderColor: colors.textPrimary },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  cancelText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
});
