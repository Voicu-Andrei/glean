import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, interestMeta, type InterestLevel } from '../theme';

type Props = {
  value: InterestLevel | null;
  onChange: (v: InterestLevel) => void;
};

const ORDER: InterestLevel[] = ['hot', 'warm', 'cold'];

export function InterestPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {ORDER.map((level) => {
        const meta = interestMeta[level];
        const active = value === level;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            style={[styles.btn, active && { borderColor: meta.dot, backgroundColor: meta.dot + '15' }]}
          >
            <View style={[styles.dot, { backgroundColor: meta.dot }]} />
            <Text style={[styles.label, active && { color: colors.textPrimary, fontWeight: '700' }]}>
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
});
