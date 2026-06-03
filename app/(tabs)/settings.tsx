import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Screen } from '../../src/components/Screen';
import { Icon } from '../../src/components/Icon';
import { FieldReportHero } from '../../src/components/FieldReportHero';
import { SectionHeader } from '../../src/components/SectionHeader';
import { StatPanel } from '../../src/components/StatPanel';
import { getMyCard, isMyCardFilled, toVCard, type MyCard } from '../../src/db/myCard';
import {
  getAccount,
  getAccountStats,
  isAccountComplete,
  saveAccount,
  type Account,
  type AccountStats,
} from '../../src/db/account';
import * as DocumentPicker from 'expo-document-picker';
import { exportContactsCsv, exportContactsZip } from '../../src/utils/export';
import { importContactsCsv } from '../../src/utils/import';
import { colors, radius, typography } from '../../src/theme';

function registeredLabel(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  return `Registered ${m} ${d.getFullYear()}`;
}

export default function AccountScreen() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [myCard, setMyCard] = useState<MyCard | null>(null);
  const [stats, setStats] = useState<AccountStats>({ events: 0, contacts: 0, hot: 0, warm: 0, cold: 0, thisWeek: 0, drafts: 0, tags: 0 });

  const reload = useCallback(async () => {
    setAccount(await getAccount());
    setMyCard(await getMyCard());
    setStats(await getAccountStats());
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  if (!account) return <Screen style={styles.flex}><View /></Screen>;

  const registered = isAccountComplete(account);
  const cardFilled = myCard ? isMyCardFilled(myCard) : false;
  const first = account.name.trim().split(/\s+/)[0] || '';
  const rest = account.name.trim().split(/\s+/).slice(1).join(' ');
  const isBiz = account.type === 'business';

  async function onExport() {
    try {
      await exportContactsCsv({ eventId: null });
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
    }
  }

  async function onExportZip() {
    try {
      await exportContactsZip({ eventId: null });
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
    }
  }

  function chooseExport() {
    Alert.alert(
      'Export contacts',
      'Pick a format.',
      [
        { text: 'Full archive (.zip with photos)', onPress: () => void onExportZip() },
        { text: 'CSV only (no photos)', onPress: () => void onExport() },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }

  async function onImport() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'public.comma-separated-values-text', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || picked.assets.length === 0) return;
      const uri = picked.assets[0].uri;

      Alert.alert(
        'Import contacts from CSV?',
        'New contacts will be added to your library. Existing ones aren\'t modified. Events and tags referenced in the file will be created if they don\'t exist. Photos are not in a CSV — only fields.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              try {
                const result = await importContactsCsv(uri);
                const lines = [
                  `${result.contacts} contact${result.contacts === 1 ? '' : 's'} added.`,
                  result.events > 0 ? `${result.events} new event${result.events === 1 ? '' : 's'}.` : null,
                  result.tags > 0 ? `${result.tags} new tag${result.tags === 1 ? '' : 's'}.` : null,
                  result.skipped > 0 ? `${result.skipped} row${result.skipped === 1 ? '' : 's'} skipped.` : null,
                  ...result.errors,
                ].filter(Boolean).join('\n');
                Alert.alert('Import complete', lines);
                await reload();
              } catch (e) {
                Alert.alert('Import failed', e instanceof Error ? e.message : String(e));
              }
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert('Could not open file', e instanceof Error ? e.message : String(e));
    }
  }

  function onResetProfile() {
    Alert.alert(
      'Reset profile?',
      'Clears your registered profile (role, name, email). My Card and contacts are untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await saveAccount({
              type: null, name: '', email: '', interests: [], location: '',
              company: '', industry: '', website: '', description: '', created_at: null,
            });
            await reload();
          },
        },
      ],
    );
  }

  return (
    <Screen style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {registered ? (
          <FieldReportHero
            kicker="MASTHEAD · PROFILE"
            rightSlot={
              <Pressable onPress={() => router.push('/account/register')} hitSlop={8}>
                <View style={styles.editPill}>
                  <Icon name="pencil" size={11} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.editPillText}>EDIT</Text>
                </View>
              </Pressable>
            }
            title={
              <Text style={styles.heroTitle} numberOfLines={2}>
                {first}
                {rest ? '\n' : ''}
                {rest ? <Text style={styles.heroTitleLight}>{rest}.</Text> : null}
              </Text>
            }
            meta={[account.company, account.industry, account.location]}
          >
            <View style={styles.roleRow}>
              <View style={[styles.roleChip, isBiz ? styles.roleChipBiz : styles.roleChipCust]}>
                <View style={[styles.roleDot, { backgroundColor: isBiz ? colors.hotNumeral : colors.pulse }]} />
                <Text style={[styles.roleChipText, { color: isBiz ? colors.hotNumeral : colors.pulse }]}>
                  {isBiz ? 'BUSINESS' : 'CUSTOMER'}
                </Text>
              </View>
              {!!registeredLabel(account.created_at) && (
                <Text style={styles.registeredText}>{registeredLabel(account.created_at)}</Text>
              )}
            </View>

            <View style={styles.statGrid}>
              <StatPanel label="EVENTS" value={stats.events} sub="all time" />
              <View style={styles.statSep} />
              <StatPanel label="CAPTURED" value={stats.contacts} sub="contacts" />
              <View style={styles.statSep} />
              <StatPanel label="HOT" value={stats.hot} valueColor={colors.hotNumeral} sub="leads" />
            </View>
          </FieldReportHero>
        ) : (
          <FieldReportHero
            kicker="MASTHEAD · PROFILE"
            title={
              <Text style={styles.heroTitle}>
                Set up{'\n'}
                <Text style={styles.heroTitleLight}>your profile.</Text>
              </Text>
            }
            meta={['Customer or business']}
          >
            <Pressable onPress={() => router.push('/account/register')} style={styles.registerCta}>
              <Icon name="person-add" size={16} color={colors.primaryDeeper} />
              <Text style={styles.registerCtaText}>Register profile</Text>
            </Pressable>
          </FieldReportHero>
        )}

        {/* My Card */}
        <View style={styles.section}>
          <SectionHeader kicker="◇ MY CARD" kickerColor={colors.primary} title="Share at the booth." />
          <Pressable onPress={() => router.push('/settings/my-card')} style={styles.cardPanel}>
            <View style={styles.qrBox}>
              {cardFilled && myCard ? (
                <QRCode value={toVCard(myCard)} size={60} color="#FFFFFF" backgroundColor={colors.primaryDeeper} />
              ) : (
                <Icon name="qr-code-outline" size={32} color="rgba(255,255,255,0.6)" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              {cardFilled && myCard ? (
                <>
                  <Text style={styles.cardName}>{myCard.name || 'Your card'}</Text>
                  {!!(myCard.role || myCard.company) && (
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {[myCard.role, myCard.company].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                  {!!myCard.email && <Text style={styles.cardEmail}>{myCard.email}</Text>}
                </>
              ) : (
                <>
                  <Text style={styles.cardName}>Set up your card</Text>
                  <Text style={styles.cardTitle}>Share your details via QR with one tap</Text>
                </>
              )}
            </View>
            <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>

          <Pressable onPress={() => router.push('/scan')} style={styles.scanRow}>
            <View style={styles.scanIcon}>
              <Icon name="qr-code-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scanLabel}>Scan a QR card</Text>
              <Text style={styles.scanHint}>Import someone's details instantly</Text>
            </View>
            <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Tools & data */}
        <View style={styles.section}>
          <SectionHeader kicker="✦ TOOLS & DATA" kickerColor={colors.textSecondary} title="The rest." />
          <ToolRow
            icon="pricetags-outline"
            label="Manage tags"
            sub="Create, rename, recolor"
            count={`${stats.tags} ${stats.tags === 1 ? 'tag' : 'tags'}`}
            color={colors.primary}
            first
            onPress={() => router.push('/account/tags')}
          />
          <ToolRow
            icon="share-outline"
            label="Export all contacts"
            sub="CSV or full archive with photos"
            count={`${stats.contacts} rows`}
            color={colors.primary}
            onPress={chooseExport}
          />
          <ToolRow
            icon="download-outline"
            label="Import contacts from CSV"
            sub="Restore from a Glean CSV export"
            color={colors.primary}
            onPress={onImport}
          />
          <ToolRow
            icon="information-circle-outline"
            label="About Glean"
            sub="v1.0.0 — field notes for booths"
            color={colors.accent}
            onPress={() => router.push('/account/about')}
          />
          {registered && (
            <ToolRow
              icon="refresh-outline"
              label="Reset profile"
              sub="Clear role & registration data"
              color={colors.danger}
              destructive
              last
              onPress={onResetProfile}
            />
          )}
        </View>

        {/* Sign-off */}
        <View style={styles.signoff}>
          <Text style={styles.signoffMain}>GLEAN · FIELD NOTES FOR BOOTHS</Text>
          <Text style={styles.signoffSub}>v1.0.0</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ToolRow({
  icon, label, sub, count, color, destructive, first, last, onPress,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  sub: string;
  count?: string;
  color: string;
  destructive?: boolean;
  first?: boolean;
  last?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.toolRow,
        first && { borderTopWidth: 1, borderTopColor: colors.divider },
        { borderBottomWidth: 1, borderBottomColor: colors.divider },
        last && { marginBottom: 0 },
      ]}
    >
      <View style={[styles.toolIcon, destructive && { backgroundColor: '#FCEAEA' }]}>
        <Icon name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.toolLabel, destructive && { color: colors.danger }]}>{label}</Text>
        <Text style={styles.toolSub}>{sub}</Text>
      </View>
      {!!count && <Text style={styles.toolCount}>{count}</Text>}
      <Icon name="chevron-forward" size={14} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: 8, paddingBottom: 100 },

  editPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999,
  },
  editPillText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },

  heroTitle: { fontSize: 38, fontWeight: '700', letterSpacing: -1.5, lineHeight: 40, color: '#FFFFFF' },
  heroTitleLight: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999 },
  roleChipBiz: { backgroundColor: 'rgba(212,130,10,0.22)' },
  roleChipCust: { backgroundColor: 'rgba(157,224,173,0.18)' },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  registeredText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  statGrid: {
    flexDirection: 'row', marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden',
  },
  statSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },

  registerCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 22, backgroundColor: '#FFFFFF',
    paddingVertical: 12, borderRadius: radius.pill,
  },
  registerCtaText: { color: colors.primaryDeeper, fontWeight: '700', fontSize: 14 },

  section: { paddingHorizontal: 20, paddingTop: 22 },

  cardPanel: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  qrBox: {
    width: 76, height: 76, borderRadius: 12,
    backgroundColor: colors.primaryDeeper,
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 },
  cardTitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardEmail: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },

  scanRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 10, backgroundColor: colors.surface,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  scanIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  scanLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  scanHint: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },

  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  toolIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.backgroundSoft, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.1 },
  toolSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  toolCount: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, fontVariant: ['tabular-nums'] },

  signoff: { paddingTop: 24, paddingHorizontal: 20, alignItems: 'center' },
  signoffMain: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, letterSpacing: 2 },
  signoffSub: { fontSize: 10, color: colors.textTertiary, marginTop: 4 },
});
