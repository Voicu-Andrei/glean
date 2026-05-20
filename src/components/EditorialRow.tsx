import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export type EditorialTag = { label: string; bg?: string; fg?: string };

type Props = {
  /** Zero-padded index string, e.g. "01". */
  index: string;
  title: string;
  meta?: string;
  tags?: EditorialTag[];
  /** Small colored dot before the title (e.g. interest level). */
  accentDot?: string;
  /** Element on the right (chevron circle, arrow, etc). */
  right?: React.ReactNode;
  /** Draw a bottom border (used on the last row of a group). */
  last?: boolean;
  /** Italic + tertiary title (e.g. "(no company)"). */
  muted?: boolean;
  onPress?: () => void;
};

/** Numbered editorial list row used on contacts / events / drafts. */
export function EditorialRow({ index, title, meta, tags = [], accentDot, right, last, muted, onPress }: Props) {
  const body = (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.index}>{index}</Text>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          {accentDot && <View style={[styles.dot, { backgroundColor: accentDot }]} />}
          <Text
            style={[styles.title, muted && styles.titleMuted]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {!!meta && <Text style={styles.meta} numberOfLines={1}>{meta}</Text>}
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.map((t, i) => (
              <View
                key={`${t.label}-${i}`}
                style={[styles.tag, { backgroundColor: t.bg ?? colors.backgroundSoft }]}
              >
                <Text style={[styles.tagText, { color: t.fg ?? colors.textSecondary }]}>{t.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {right}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  rowLast: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  index: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, width: 24, fontVariant: ['tabular-nums'] },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2, flexShrink: 1 },
  titleMuted: { color: colors.textTertiary, fontStyle: 'italic' },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  tagText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});
