import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  /** Small uppercase label at the top-left of the hero. */
  kicker: string;
  /** Display-weight title — string or composed nodes. */
  title: React.ReactNode;
  /** Dot-separated meta line below the title. Falsy entries are dropped. */
  meta?: (string | null | undefined)[];
  /** Optional element pinned to the top-right (e.g. an EDIT pill). */
  rightSlot?: React.ReactNode;
  /** Extra content rendered below the meta line (stats, bars, etc). */
  children?: React.ReactNode;
};

/**
 * The shared dark "field report" cover used across V3 screens — a deep-teal
 * card with an editorial kicker, big title, dot-separated meta, and a slot
 * for stats/children. Mirrors the web prototype's FieldReportHero.
 */
export function FieldReportHero({ kicker, title, meta, rightSlot, children }: Props) {
  const metaItems = (meta ?? []).filter(Boolean) as string[];
  return (
    <View style={styles.cover}>
      <View style={styles.header}>
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
  );
}

const styles = StyleSheet.create({
  cover: {
    backgroundColor: colors.primaryDeeper,
    borderRadius: 28,
    marginHorizontal: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 40,
    color: '#FFFFFF',
    marginTop: 16,
  },
  titleWrap: { marginTop: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.78)', fontWeight: '600', letterSpacing: 0.3 },
});
