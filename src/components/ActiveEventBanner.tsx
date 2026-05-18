import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme';
import type { EventRow } from '../db/events';

type Props = {
  event: EventRow | null;
};

export function ActiveEventBanner({ event }: Props) {
  const router = useRouter();
  const onPress = () => router.push('/(tabs)/events');

  if (!event) {
    return (
      <Pressable onPress={onPress} style={[styles.banner, styles.bannerEmpty]}>
        <View style={styles.dot} />
        <Text style={styles.textEmpty}>No active event — tap to choose</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.banner}>
      <View style={styles.dot} />
      <Text style={styles.text} numberOfLines={1}>
        Active: {event.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  bannerEmpty: { backgroundColor: colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9DE0AD' },
  text: { color: colors.surface, fontSize: 13, fontWeight: '600', flex: 1, letterSpacing: 0.2 },
  textEmpty: { color: colors.surface, fontSize: 13, fontWeight: '500' },
});
