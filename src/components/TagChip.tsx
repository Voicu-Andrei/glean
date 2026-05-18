import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

type Props = {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
  small?: boolean;
};

export function TagChip({ label, color, selected, onPress, small }: Props) {
  const bg = color ?? '#6B7280';
  const inner = (
    <View
      style={[
        styles.chip,
        small && styles.chipSmall,
        { borderColor: bg, backgroundColor: selected ? bg : 'transparent' },
      ]}
    >
      <Text
        style={[
          styles.label,
          small && styles.labelSmall,
          { color: selected ? colors.surface : bg },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }
  return inner;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: { fontSize: 12, fontWeight: '500' },
  labelSmall: { fontSize: 11 },
});
