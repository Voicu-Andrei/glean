import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, typography } from '../theme';
import {
  addPhoto,
  fullPathFor,
  saveAllPhotosToLibrary,
  type PhotoRow,
  type PhotoType,
  updatePhotoLabel,
} from '../db/photos';
import { Icon } from './Icon';
import { PhotoViewer } from './PhotoViewer';
import { success, warning } from '../utils/haptics';

type Props = {
  contactId: number;
  photos: PhotoRow[];
  onChange: () => void;
};

const ADDITIONAL_LIMIT = 4;
const BUSINESS_CARD_LIMIT = 2;
const BOOTH_LIMIT = 1;

export function PhotoStrip({ contactId, photos, onChange }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const businessCards = photos.filter((p) => p.photo_type === 'business_card');
  const booth = photos.filter((p) => p.photo_type === 'booth');
  const additional = photos.filter((p) => p.photo_type === 'additional');

  function openViewer(photo: PhotoRow) {
    const idx = photos.findIndex((p) => p.id === photo.id);
    setViewerIndex(idx >= 0 ? idx : 0);
  }

  async function onSaveAll() {
    const n = await saveAllPhotosToLibrary(contactId);
    if (n < 0) {
      warning();
      Alert.alert('Permission needed', 'Allow photo library access in Settings to save.');
    } else if (n === 0) {
      Alert.alert('No photos', 'Nothing to save yet.');
    } else {
      success();
      Alert.alert('Saved', `${n} ${n === 1 ? 'photo' : 'photos'} saved to your camera roll.`);
    }
  }

  return (
    <View style={{ gap: 16 }}>
      {photos.length > 0 && (
        <Pressable onPress={() => void onSaveAll()} style={styles.saveAll} hitSlop={6}>
          <Icon name="download-outline" size={14} color={colors.primary} />
          <Text style={styles.saveAllText}>Save all to camera roll</Text>
        </Pressable>
      )}

      <PhotoSection title="Business Card" type="business_card" contactId={contactId} items={businessCards} limit={BUSINESS_CARD_LIMIT} onChange={onChange} onOpen={openViewer} />
      <PhotoSection title="Booth Photo" type="booth" contactId={contactId} items={booth} limit={BOOTH_LIMIT} onChange={onChange} onOpen={openViewer} />
      <PhotoSection title="Additional" type="additional" contactId={contactId} items={additional} limit={ADDITIONAL_LIMIT} onChange={onChange} onOpen={openViewer} />

      <PhotoViewer
        photos={photos}
        startIndex={viewerIndex}
        onClose={() => setViewerIndex(null)}
        onChange={onChange}
      />
    </View>
  );
}

type SectionProps = {
  title: string;
  type: PhotoType;
  contactId: number;
  items: PhotoRow[];
  limit: number;
  onChange: () => void;
  onOpen: (p: PhotoRow) => void;
};

function PhotoSection({ title, type, contactId, items, limit, onChange, onOpen }: SectionProps) {
  const [labeling, setLabeling] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  const canAddMore = items.length < limit;

  async function pickPhoto(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please enable access in Settings to attach a photo.');
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] });
    if (result.canceled || result.assets.length === 0) return;
    await addPhoto(contactId, type, result.assets[0].uri, null);
    onChange();
  }

  function promptAdd() {
    Alert.alert(title, 'Add a photo', [
      { text: 'Take Photo', onPress: () => void pickPhoto('camera') },
      { text: 'Choose from Library', onPress: () => void pickPhoto('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function saveLabel(id: number) {
    await updatePhotoLabel(id, labelDraft.trim() || null);
    setLabeling(null);
    setLabelDraft('');
    onChange();
  }

  return (
    <View>
      <Text style={typography.sectionLabel}>{title}</Text>
      <View style={styles.row}>
        {items.map((p) => (
          <View key={p.id} style={styles.thumbWrap}>
            <Pressable
              onPress={() => onOpen(p)}
              onLongPress={() => {
                setLabeling(p.id);
                setLabelDraft(p.label ?? '');
              }}
            >
              <Image source={{ uri: fullPathFor(p.file_path) }} style={styles.thumb} />
              <View style={styles.expandBadge}>
                <Icon name="expand" size={11} color="#FFFFFF" />
              </View>
            </Pressable>
            {labeling === p.id ? (
              <View style={styles.labelEditor}>
                <TextInput
                  value={labelDraft}
                  onChangeText={setLabelDraft}
                  placeholder="Label"
                  style={styles.labelInput}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => void saveLabel(p.id)}
                  onBlur={() => void saveLabel(p.id)}
                />
              </View>
            ) : (
              !!p.label && (
                <Text style={styles.thumbLabel} numberOfLines={1}>
                  {p.label}
                </Text>
              )
            )}
          </View>
        ))}
        {canAddMore && (
          <Pressable onPress={promptAdd} style={styles.addThumb}>
            <Text style={styles.addPlus}>+</Text>
          </Pressable>
        )}
      </View>
      {items.length > 0 && (
        <Text style={styles.hint}>Tap to view · long-press to label</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  saveAll: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primarySoft, paddingVertical: 10, borderRadius: radius.md,
  },
  saveAllText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  thumbWrap: { width: 72 },
  thumb: { width: 72, height: 72, borderRadius: radius.card, backgroundColor: colors.background },
  expandBadge: {
    position: 'absolute', right: 4, bottom: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  thumbLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  labelEditor: { marginTop: 4 },
  labelInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, fontSize: 11,
  },
  addThumb: {
    width: 72, height: 72, borderRadius: radius.card,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  addPlus: { fontSize: 28, color: colors.textSecondary, lineHeight: 30 },
  hint: { fontSize: 11, color: colors.textSecondary, marginTop: 6 },
});
