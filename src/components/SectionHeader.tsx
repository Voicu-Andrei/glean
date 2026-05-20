import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  /** Small uppercase label, often with a leading glyph (e.g. "◇ MY CARD"). */
  kicker: string;
  kickerColor?: string;
  /** Editorial headline below the kicker. */
  title: string;
  /** Optional right-aligned action (e.g. "All →"). */
  action?: { label: string; onPress: () => void };
};

/** Editorial section header — kicker + headline, used across V3 screens. */
export function SectionHeader({ kicker, kickerColor = colors.textSecondary, title, action }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.kicker, { color: kickerColor }]}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {action && (
        <Pressable onPress={action.onPress} hitSlop={6}>
          <Text style={styles.action}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: colors.textPrimary, marginTop: 2 },
  action: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
