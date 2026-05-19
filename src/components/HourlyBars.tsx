import { StyleSheet, View } from 'react-native';

type Props = {
  /** Bar values — typically a length-24 array (one per hour) clipped to the venue window. */
  values: number[];
  /** Bar color when value > 0. */
  color?: string;
  /** Track color for empty hours. */
  trackColor?: string;
  height?: number;
};

/**
 * Tiny horizontal bar chart — pure View, no svg/canvas. Used in the
 * dashboard hero to give a rhythm of today's captures.
 */
export function HourlyBars({
  values,
  color = 'rgba(255,255,255,0.85)',
  trackColor = 'rgba(255,255,255,0.15)',
  height = 28,
}: Props) {
  const max = Math.max(1, ...values);
  return (
    <View style={[styles.row, { height }]}>
      {values.map((v, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: v > 0 ? color : trackColor,
              height: `${Math.max(8, (v / max) * 100)}%`,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
  },
});
