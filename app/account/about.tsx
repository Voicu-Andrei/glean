import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Icon } from '../../src/components/Icon';
import { colors, elevation, radius, typography } from '../../src/theme';

export default function AboutScreen() {
  const router = useRouter();
  return (
    <Screen style={styles.flex}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Icon name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>About Glean</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={typography.title as object}>Glean v1.0</Text>
          <Text style={[typography.body, { marginTop: 6, color: colors.textSecondary }]}>
            Local-first field CRM for trade fairs.
          </Text>
          <Text style={[typography.callout, { marginTop: 12, lineHeight: 20 }]}>
            All your contacts, photos, and events live on this device. No accounts, no internet
            required for any capture or review flow.
          </Text>
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={typography.sectionLabel}>Coming soon</Text>
          <Text style={[typography.body, { marginTop: 8, lineHeight: 20 }]}>
            A feed of upcoming fairs, plus the ability to track businesses you care about and
            get notified when they exhibit nearby.
          </Text>
        </View>
      </ScrollView>
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
    padding: 16,
    ...elevation.card,
  },
});
