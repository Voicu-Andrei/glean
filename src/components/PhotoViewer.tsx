import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Icon } from './Icon';
import { colors } from '../theme';
import {
  deletePhoto,
  fullPathFor,
  savePhotoToLibrary,
  type PhotoRow,
} from '../db/photos';
import { success, warning } from '../utils/haptics';

type Props = {
  photos: PhotoRow[];
  /** Index to open at; null = closed. */
  startIndex: number | null;
  onClose: () => void;
  onChange: () => void;
};

const { width } = Dimensions.get('window');

export function PhotoViewer({ photos, startIndex, onClose, onChange }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (startIndex != null) setIndex(startIndex);
  }, [startIndex]);

  if (startIndex == null || photos.length === 0) return null;
  const current = photos[Math.min(index, photos.length - 1)];

  async function onDownload() {
    if (!current) return;
    const ok = await savePhotoToLibrary(current.file_path);
    if (ok) {
      success();
      Alert.alert('Saved', 'Photo saved to your camera roll.');
    } else {
      warning();
      Alert.alert('Permission needed', 'Allow photo library access in Settings to save.');
    }
  }

  function onDelete() {
    if (!current) return;
    Alert.alert('Remove photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deletePhoto(current.id);
          onChange();
          if (photos.length <= 1) onClose();
          else setIndex((i) => Math.max(0, i - 1));
        },
      },
    ]);
  }

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.iconBtn} hitSlop={8}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.counter}>
            {Math.min(index, photos.length - 1) + 1} / {photos.length}
          </Text>
          <Pressable onPress={onDelete} style={styles.iconBtn} hitSlop={8}>
            <Icon name="trash-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: Math.min(index, photos.length - 1) * width, y: 0 }}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={styles.flex}
        >
          {photos.map((p) => (
            <View key={p.id} style={[styles.page, { width }]}>
              <Image source={{ uri: fullPathFor(p.file_path) }} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        {!!current?.label && <Text style={styles.label}>{current.label}</Text>}

        <View style={styles.bottomBar}>
          <Pressable onPress={() => void onDownload()} style={styles.downloadBtn}>
            <Icon name="download-outline" size={18} color={colors.primaryDeeper} />
            <Text style={styles.downloadText}>Save to camera roll</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  counter: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  label: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontSize: 13, paddingVertical: 8 },
  bottomBar: { paddingHorizontal: 20, paddingBottom: 44, paddingTop: 8 },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 999,
  },
  downloadText: { color: colors.primaryDeeper, fontWeight: '700', fontSize: 15 },
});
