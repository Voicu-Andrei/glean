import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  /** Small uppercase label at the top-left of the hero. */
  kicker: string;
  /** Display-weight title — string or composed nodes. */
  title: React.ReactNode;
  /** Dot-separated meta line below the title. Falsy entries are dropped. */
  meta?: (string | null | undefined)[];
  /** Show the LIVE pulse pill before the kicker. */
  live?: boolean;
  /** Optional element pinned to the top-right (e.g. an EDIT pill). */
  rightSlot?: React.ReactNode;
  /** Extra content rendered below the meta line (stats, bars, etc). */
  children?: React.ReactNode;
};

const ARCS = [40, 80, 120, 160, 200, 240, 280];

/**
 * Shared dark "field report" cover used across V3 screens — a deep-teal card
 * with concentric-arc texture, an editorial kicker (optionally a LIVE pill),
 * a big title, dot-separated meta, and a slot for stats/children.
 */
export function FieldReportHero({ kicker, title, meta, live, rightSlot, children }: Props) {
  const metaItems = (meta ?? []).filter(Boolean) as string[];
  return (
    <View style={styles.cover}>
      <Svg width={380} height={380} viewBox="0 0 400 400" style={styles.arcs}>
        <G fill="none" stroke={colors.pulse} strokeWidth={1}>
          {ARCS.map((r) => <Circle key={r} cx={200} cy={200} r={r} />)}
        </G>
      </Svg>

      <View style={styles.inner}>
        <View style={styles.header}>
          {live && (
            <View style={styles.livePill}>
              <View style={styles.pulse} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          <Text style={styles.kicker}>{kicker}</Text>
          <View style={{ flex: 1 }} />
          {rightSlot}
        </View>

        {typeof title === 'string' ? (
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        ) : (
          <View style={styles.titleWrap}>{title}</View>
        )}

        {metaItems.length > 0 && (
          <View style={styles.metaRow}>
            {metaItems.map((m, i) => (
              <View key={`${m}-${i}`} style={styles.metaItem}>
                {i > 0 && <View style={styles.dot} />}
                <Text style={styles.metaText}>{m}</Text>
              </View>
            ))}
          </View>
        )}

        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    backgroundColor: colors.primaryDeeper,
    borderRadius: 28,
    marginHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  arcs: { position: 'absolute', right: -120, top: -80, opacity: 0.18 },
  inner: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10,
  },
  pulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.pulse },
  liveText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.92)' },
  kicker: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8 },
  title: {
    fontSize: 38, fontWeight: '700', letterSpacing: -1.5, lineHeight: 40,
    color: '#FFFFFF', marginTop: 16,
  },
  titleWrap: { marginTop: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.78)', fontWeight: '600', letterSpacing: 0.3 },
});
