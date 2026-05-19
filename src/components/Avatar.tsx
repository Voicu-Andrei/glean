import { StyleSheet, Text, View } from 'react-native';

type Props = {
  /** Source string used to derive initials. */
  name: string | null | undefined;
  /** Hue 0-360 — pick something stable per contact (e.g. id-based). */
  hue?: number;
  size?: number;
  /** White ring around the avatar (used in the hot-leads pile). */
  ring?: boolean;
};

export function Avatar({ name, hue = 200, size = 36, ring = false }: Props) {
  const initials = (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '··';

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `hsl(${hue}, 38%, 88%)`,
          ...(ring
            ? {
                borderWidth: 2,
                borderColor: '#FFFFFF',
                shadowColor: `hsl(${hue}, 35%, 70%)`,
                shadowOpacity: 1,
                shadowRadius: 0,
                shadowOffset: { width: 0, height: 0 },
              }
            : null),
        },
      ]}
    >
      <Text
        style={{
          color: `hsl(${hue}, 45%, 32%)`,
          fontSize: size * 0.38,
          fontWeight: '700',
          letterSpacing: 0.3,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

/** Stable hue from any string (e.g. contact id or company name). */
export function hueFromId(seed: string | number): number {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
