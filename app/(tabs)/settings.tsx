import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Screen } from '../../src/components/Screen';
import {
  createTag,
  deleteTag,
  listTagsWithCount,
  renameTag,
  type TagWithCount,
} from '../../src/db/tags';
import { exportContactsCsv } from '../../src/utils/export';
import { colors, radius, elevation, typography } from '../../src/theme';

export default function SettingsScreen() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [newTag, setNewTag] = useState('');
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const reload = useCallback(async () => {
    setTags(await listTagsWithCount());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function onCreate() {
    const name = newTag.trim();
    if (name.length === 0) return;
    try {
      await createTag(name);
      setNewTag('');
      await reload();
    } catch {
      Alert.alert('Could not create tag', 'A tag with that name already exists.');
    }
  }

  async function onDelete(t: TagWithCount) {
    Alert.alert(
      `Delete "${t.name}"?`,
      t.contact_count > 0
        ? `This will remove the tag from ${t.contact_count} ${
            t.contact_count === 1 ? 'contact' : 'contacts'
          }.`
        : 'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTag(t.id);
            await reload();
          },
        },
      ],
    );
  }

  async function onRenameSave() {
    if (renamingId == null) return;
    const name = renameDraft.trim();
    if (name.length === 0) {
      setRenamingId(null);
      return;
    }
    try {
      await renameTag(renamingId, name);
    } catch {
      Alert.alert('Could not rename', 'Another tag already uses that name.');
    }
    setRenamingId(null);
    setRenameDraft('');
    await reload();
  }

  async function onExportAll() {
    try {
      await exportContactsCsv({ eventId: null });
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Screen style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle}>Settings</Text>

        <Text style={[typography.sectionLabel, { marginTop: 16 }]}>Tags</Text>
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
          {tags.length === 0 && <Text style={styles.empty}>No tags yet.</Text>}
          {tags.map((t) => (
            <View key={t.id} style={styles.tagRow}>
              {renamingId === t.id ? (
                <>
                  <TextInput
                    value={renameDraft}
                    onChangeText={setRenameDraft}
                    style={[styles.addInput, { flex: 1 }]}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={() => void onRenameSave()}
                    onBlur={() => void onRenameSave()}
                  />
                </>
              ) : (
                <Pressable
                  onPress={() => {
                    setRenamingId(t.id);
                    setRenameDraft(t.name);
                  }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <View style={[styles.tagDot, { backgroundColor: t.color }]} />
                  <Text style={styles.tagLabel}>{t.name}</Text>
                  <Text style={styles.tagCount}>· {t.contact_count}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => void onDelete(t)} hitSlop={8}>
                <Text style={styles.deleteAction}>Delete</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={[typography.sectionLabel, { marginTop: 24 }]}>Export</Text>
        <Pressable onPress={() => void onExportAll()} style={[styles.card, styles.actionCard]}>
          <Text style={styles.actionLabel}>Export All Contacts (CSV)</Text>
          <Text style={styles.actionHint}>Opens the iOS share sheet — AirDrop, Mail, Files…</Text>
        </Pressable>

        <Text style={[typography.sectionLabel, { marginTop: 24 }]}>About</Text>
        <View style={[styles.card, { paddingVertical: 16 }]}>
          <Text style={styles.bodyText}>Glean v1.0 — local-first field CRM for trade fairs.</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary, marginTop: 4 }]}>
            All data lives on this device. No accounts. No internet required.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 60 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    marginTop: 8,
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
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addBtnLabel: { color: colors.surface, fontWeight: '700' },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: colors.background,
  },
  tagDot: { width: 10, height: 10, borderRadius: 5 },
  tagLabel: { fontSize: 15, color: colors.textPrimary },
  tagCount: { fontSize: 13, color: colors.textSecondary },
  deleteAction: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  actionCard: { paddingVertical: 16 },
  actionLabel: { fontSize: 16, fontWeight: '600', color: colors.primary },
  actionHint: { ...typography.secondary, marginTop: 4 },
  empty: { textAlign: 'center', paddingVertical: 12, color: colors.textSecondary },
  bodyText: { fontSize: 14, color: colors.textPrimary },
});
