import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: number | string;
  /** Optional accent color for the value (e.g. amber for "hot"). */
  valueColor?: string;
  /** Sub-label under the number. */
  sub?: string;
  /** Two visual modes — on the dark hero (dark) or on cream (light). */
  variant?: 'dark' | 'light';
};

/** Editorial stat panel — used in the hero grid and below. */
export function StatPanel({ label, value, valueColor, sub, variant = 'dark' }: Props) {
  const dark = variant === 'dark';
  return (
    <View
      style={[
        styles.panel,
        dark
          ? { backgroundColor: 'rgba(255,255,255,0.06)' }
          : { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFEFF1' },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: dark ? 'rgba(255,255,255,0.6)' : '#A1A1A6' },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          { color: valueColor ?? (dark ? '#FFFFFF' : '#1C1C1E') },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {sub ? (
        <Text
          style={[
            styles.sub,
            { color: dark ? 'rgba(255,255,255,0.6)' : '#6E6E73' },
          ]}
        >
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  label: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
  },
  value: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 40,
    marginTop: 2,
  },
  sub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
