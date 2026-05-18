import { StyleSheet, Text, View } from 'react-native';
import { colors, interestMeta, type InterestLevel } from '../theme';

type Props = {
  level: InterestLevel | null;
  size?: 'sm' | 'md';
  withLabel?: boolean;
};

export function InterestBadge({ level, size = 'sm', withLabel = false }: Props) {
  if (!level) {
    return withLabel ? (
      <View style={styles.row}>
        <View style={[styles.dot, size === 'md' && styles.dotMd, { backgroundColor: colors.border }]} />
        <Text style={styles.label}>None</Text>
      </View>
    ) : (
      <View style={[styles.dot, size === 'md' && styles.dotMd, { backgroundColor: colors.border }]} />
    );
  }
  const meta = interestMeta[level];
  return (
    <View style={styles.row}>
      <View style={[styles.dot, size === 'md' && styles.dotMd, { backgroundColor: meta.dot }]} />
      {withLabel && <Text style={styles.label}>{meta.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotMd: { width: 14, height: 14, borderRadius: 7 },
  label: { fontSize: 13, fontWeight: '500', color: colors.textPrimary },
});
