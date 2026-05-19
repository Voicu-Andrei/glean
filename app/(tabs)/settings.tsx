import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Icon } from '../../src/components/Icon';
import {
  createTag,
  deleteTag,
  listTagsWithCount,
  renameTag,
  setTagColor,
  TAG_COLORS,
  type TagWithCount,
} from '../../src/db/tags';
import { getMyCard, isMyCardFilled, type MyCard } from '../../src/db/myCard';
import { getAccount, isAccountComplete, type Account } from '../../src/db/account';
import { exportContactsCsv } from '../../src/utils/export';
import { colors, radius, elevation, typography } from '../../src/theme';

export default function AccountScreen() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [myCard, setMyCard] = useState<MyCard | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const reload = useCallback(async () => {
    setAccount(await getAccount());
    setMyCard(await getMyCard());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  if (!account) return <Screen style={styles.flex}><View /></Screen>;

  const registered = isAccountComplete(account);
  const myCardFilled = myCard ? isMyCardFilled(myCard) : false;

  return (
    <Screen style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Account</Text>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} style={styles.menuBtn}>
          <Icon name="menu" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile hero */}
        {registered ? (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>
                {(account.name.trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('') || '?').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{account.name}</Text>
              {account.type === 'business' ? (
                <Text style={styles.profileSub}>
                  {[account.company, account.industry].filter(Boolean).join(' · ')}
                </Text>
              ) : (
                <Text style={styles.profileSub}>
                  {account.location || 'Customer'}
                </Text>
              )}
              <View style={styles.roleRow}>
                <View style={[styles.rolePill, account.type === 'business' ? styles.rolePillBiz : styles.rolePillCust]}>
                  <Icon
                    name={account.type === 'business' ? 'briefcase' : 'search'}
                    size={11}
                    color={account.type === 'business' ? colors.accent : colors.primary}
                  />
                  <Text style={[styles.rolePillText, { color: account.type === 'business' ? colors.accent : colors.primary }]}>
                    {account.type === 'business' ? 'Business' : 'Customer'}
                  </Text>
                </View>
                <Pressable onPress={() => router.push('/account/register')} hitSlop={6}>
                  <Text style={styles.editLink}>Edit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/account/register')} style={styles.registerCard}>
            <View style={styles.registerIconWrap}>
              <Icon name="person-add" size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.registerTitle}>Register your profile</Text>
              <Text style={styles.registerBody}>
                As a customer or a business — unlocks the upcoming feed of fairs and tracked businesses.
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>
        )}

        {/* My Card */}
        <Text style={[typography.sectionLabel, { marginTop: 22 }]}>My Card</Text>
        <Pressable
          onPress={() => router.push('/settings/my-card')}
          style={[styles.linkCard]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
            <Icon name="qr-code" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkLabel}>
              {myCardFilled ? (myCard?.name || 'Your card') : 'Set up your card'}
            </Text>
            <Text style={styles.linkHint}>
              {myCardFilled
                ? 'View QR · share at booths · edit'
                : 'Share your details via QR with one tap'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>

        <Pressable onPress={() => router.push('/scan')} style={[styles.linkCard]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
            <Icon name="scan" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkLabel}>Scan a QR card</Text>
            <Text style={styles.linkHint}>Import someone's details instantly</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>

        {/* Feed teaser */}
        {registered && (
          <View style={styles.teaserCard}>
            <View style={styles.teaserIcon}>
              <Icon name="sparkles" size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.teaserTitle}>Coming soon: the Feed</Text>
              <Text style={styles.teaserBody}>
                {account.type === 'business'
                  ? 'Get discovered by attendees searching your industry.'
                  : 'Discover fairs near you and follow businesses you care about.'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <SettingsSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onTags={() => { setMenuOpen(false); router.push('/account/tags'); }}
        onExport={async () => {
          setMenuOpen(false);
          try {
            await exportContactsCsv({ eventId: null });
          } catch (e) {
            Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
          }
        }}
        onAbout={() => { setMenuOpen(false); router.push('/account/about'); }}
      />
    </Screen>
  );
}

function SettingsSheet({
  visible, onClose, onTags, onExport, onAbout,
}: {
  visible: boolean;
  onClose: () => void;
  onTags: () => void;
  onExport: () => void;
  onAbout: () => void;
}) {
  const items: Array<{ icon: React.ComponentProps<typeof Icon>['name']; label: string; sub: string; onPress: () => void; tint?: string }> = [
    { icon: 'pricetags-outline', label: 'Manage tags', sub: 'Create, rename, recolor', onPress: onTags },
    { icon: 'share-outline', label: 'Export all contacts', sub: 'CSV via share sheet', onPress: onExport },
    { icon: 'information-circle-outline', label: 'About Glean', sub: 'Version & info', onPress: onAbout },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Settings</Text>
          {items.map((it) => (
            <Pressable key={it.label} onPress={it.onPress} style={styles.sheetRow}>
              <View style={styles.sheetIcon}>
                <Icon name={it.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetRowLabel}>{it.label}</Text>
                <Text style={styles.sheetRowSub}>{it.sub}</Text>
              </View>
              <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  screenTitle: { ...typography.largeTitle, color: colors.textPrimary },
  menuBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  scroll: { padding: 16, paddingBottom: 60 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitials: { color: colors.surface, fontSize: 22, fontWeight: '700', letterSpacing: 0.5 },
  profileName: { ...typography.headline, color: colors.textPrimary },
  profileSub: { ...typography.tertiary, color: colors.textSecondary, marginTop: 2 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
  },
  rolePillCust: { backgroundColor: colors.primarySoft },
  rolePillBiz: { backgroundColor: colors.warmTint },
  rolePillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  editLink: { color: colors.primary, fontSize: 12, fontWeight: '600' },

  registerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...elevation.card,
  },
  registerIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  registerTitle: { ...typography.headline, color: colors.textPrimary },
  registerBody: { ...typography.tertiary, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },

  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    marginTop: 8,
    ...elevation.card,
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  linkLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  linkHint: { ...typography.tertiary, marginTop: 2 },

  teaserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    padding: 14,
    borderRadius: radius.card,
    backgroundColor: colors.warmTint,
  },
  teaserIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFFFFF80',
    alignItems: 'center', justifyContent: 'center',
  },
  teaserTitle: { fontSize: 14, fontWeight: '700', color: colors.accent },
  teaserBody: { ...typography.tertiary, color: colors.textPrimary, marginTop: 2, lineHeight: 16 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 18,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 12,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
  },
  sheetIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetRowLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  sheetRowSub: { ...typography.tertiary, marginTop: 2 },
  closeBtn: {
    marginTop: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.primary,
  },
  closeText: { color: colors.surface, fontWeight: '700', fontSize: 15 },
});
