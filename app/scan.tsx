import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Screen } from '../src/components/Screen';
import { Icon } from '../src/components/Icon';
import { fromVCard } from '../src/db/myCard';
import { createContact } from '../src/db/contacts';
import { getActiveEvent } from '../src/db/events';
import { colors, radius, typography } from '../src/theme';
import { success, warning } from '../src/utils/haptics';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const handled = useRef(false);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  async function onScan(raw: string) {
    if (handled.current) return;
    handled.current = true;
    setScanning(false);

    const parsed = fromVCard(raw);
    if (!parsed.name && !parsed.email && !parsed.phone && !parsed.company) {
      warning();
      Alert.alert(
        'Not a Glean QR card',
        'This QR code does not contain contact details. Try another one.',
        [{ text: 'OK', onPress: () => { handled.current = false; setScanning(true); } }],
      );
      return;
    }

    const company = parsed.company || parsed.name || 'Unknown';
    const active = await getActiveEvent();
    try {
      const id = await createContact({
        event_id: active?.id ?? null,
        company_name: company,
        contact_name: parsed.name || null,
        role: parsed.role || null,
        phone: parsed.phone || null,
        email: parsed.email || null,
        website: parsed.website || null,
        notes: parsed.notes || null,
        interest_level: 'warm',
        date_met: active?.start_date,
      });
      success();
      Alert.alert(
        'Contact added',
        `${parsed.name || company} is now in your contacts.`,
        [
          { text: 'View', onPress: () => router.replace({ pathname: '/contact/[id]', params: { id } }) },
          { text: 'Scan another', onPress: () => { handled.current = false; setScanning(true); } },
          { text: 'Done', style: 'cancel', onPress: () => router.back() },
        ],
      );
    } catch (e) {
      warning();
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
      handled.current = false;
      setScanning(true);
    }
  }

  if (!permission) {
    return <Screen style={styles.flex}><View /></Screen>;
  }

  if (!permission.granted) {
    return (
      <Screen style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Icon name="close" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Scan QR Card</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.permWrap}>
          <Icon name="camera-outline" size={56} color={colors.textTertiary} />
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permBody}>
            Glean needs the camera to scan QR cards from people you meet.
          </Text>
          <Pressable onPress={() => void requestPermission()} style={styles.permBtn}>
            <Text style={styles.permBtnText}>Grant access</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.fullscreen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning ? (e) => void onScan(e.data) : undefined}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
            <Icon name="close" size={22} color={colors.surface} />
          </Pressable>
          <Text style={styles.scanTitle}>Scan QR Card</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.frameWrap}>
          <View style={styles.frame}>
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />
          </View>
          <Text style={styles.frameHint}>Align the QR code inside the frame</Text>
        </View>
      </View>
    </View>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const map = {
    tl: { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
    tr: { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
    bl: { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
    br: { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  } as const;
  return <View style={[styles.corner, map[pos]]} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  fullscreen: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  scanTitle: { color: colors.surface, fontSize: 17, fontWeight: '700' },
  frameWrap: { alignItems: 'center', paddingBottom: 140 },
  frame: { width: 240, height: 240 },
  frameHint: { color: colors.surface, fontSize: 13, marginTop: 16, opacity: 0.9 },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  permWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  permTitle: { ...typography.title, color: colors.textPrimary, marginTop: 12 },
  permBody: { ...typography.secondary, textAlign: 'center', marginTop: 4 },
  permBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  permBtnText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
});
