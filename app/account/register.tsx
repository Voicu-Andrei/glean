import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Icon } from '../../src/components/Icon';
import {
  getAccount,
  isAccountComplete,
  saveAccount,
  SUGGESTED_INDUSTRIES,
  type Account,
  type AccountType,
} from '../../src/db/account';
import { getMyCard, saveMyCard } from '../../src/db/myCard';
import { colors, elevation, radius, typography } from '../../src/theme';
import { success, warning } from '../../src/utils/haptics';

type Step = 'type' | 'details';

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('type');
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    void getAccount().then((a) => {
      setAccount(a);
      // Only auto-advance if the user has actually completed registration before.
      // A partially-filled or abandoned previous attempt still starts on the type picker.
      if (isAccountComplete(a)) setStep('details');
    });
  }, []);

  function patch<K extends keyof Account>(key: K, value: Account[K]) {
    setAccount((a) => (a ? { ...a, [key]: value } : a));
  }

  function chooseType(t: AccountType) {
    setAccount((a) => {
      if (!a) return a;
      // Clear role-specific fields when switching so the wrong-mode draft can't leak in.
      if (t === 'customer') {
        return { ...a, type: t, company: '', industry: '', website: '', description: '' };
      }
      return { ...a, type: t, interests: [] };
    });
    setStep('details');
  }

  function toggleInterest(item: string) {
    setAccount((a) => {
      if (!a) return a;
      const has = a.interests.includes(item);
      return {
        ...a,
        interests: has ? a.interests.filter((x) => x !== item) : [...a.interests, item],
      };
    });
  }

  async function onSave() {
    if (!account || !account.type) return;
    const name = account.name.trim();
    const email = account.email.trim();
    if (!name) {
      warning();
      Alert.alert('Name required');
      return;
    }
    if (!email) {
      warning();
      Alert.alert('Email required');
      return;
    }
    if (!/.+@.+\..+/.test(email)) {
      warning();
      Alert.alert('Check the email', `"${email}" doesn't look like a valid email address.`);
      return;
    }
    if (account.type === 'business' && !account.company.trim()) {
      warning();
      Alert.alert('Company required for business accounts');
      return;
    }
    const next: Account = { ...account, name, email };
    await saveAccount(next);

    // Bridge: prefill My Card from the profile if it's empty, so users don't
    // re-enter their name+email twice. Existing My Card data is left intact.
    try {
      const card = await getMyCard();
      const patched = {
        ...card,
        name: card.name || name,
        email: card.email || email,
        company: card.company || (next.type === 'business' ? next.company : ''),
        role: card.role,
        website: card.website || next.website,
      };
      await saveMyCard(patched);
    } catch {
      // non-fatal — My Card prefill is a convenience
    }

    success();
    router.back();
  }

  if (!account) return <Screen style={styles.flex}><View /></Screen>;

  return (
    <Screen style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 56 }}>
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {step === 'type' ? 'Get started' : (account.type === 'business' ? 'Business profile' : 'Customer profile')}
          </Text>
          {step === 'details' ? (
            <Pressable onPress={() => void onSave()} hitSlop={10} style={{ width: 56, alignItems: 'flex-end' }}>
              <Text style={[styles.headerAction, { fontWeight: '700' }]}>Save</Text>
            </Pressable>
          ) : (
            <View style={{ width: 56 }} />
          )}
        </View>

        {step === 'type' ? (
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.intro}>
              How do you plan to use Glean? You can change this later.
            </Text>

            <Pressable onPress={() => chooseType('customer')} style={[styles.bigCard, account.type === 'customer' && styles.bigCardActive]}>
              <View style={[styles.bigCardIcon, { backgroundColor: colors.primarySoft }]}>
                <Icon name="search" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bigCardTitle}>I'm a Customer</Text>
                <Text style={styles.bigCardBody}>
                  Discover fairs, track businesses you care about, capture contacts at booths.
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
            </Pressable>

            <Pressable onPress={() => chooseType('business')} style={[styles.bigCard, account.type === 'business' && styles.bigCardActive]}>
              <View style={[styles.bigCardIcon, { backgroundColor: colors.warmTint }]}>
                <Icon name="briefcase" size={28} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bigCardTitle}>I'm a Business</Text>
                <Text style={styles.bigCardBody}>
                  Exhibit at fairs, get discovered by attendees, share your card via QR.
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
            </Pressable>

            <Text style={styles.note}>
              Both modes work fully offline. Cross-account features (feed, tracking) are coming soon.
            </Text>
          </ScrollView>
        ) : (
          <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
            <Field label="Full Name *">
              <TextInput
                value={account.name}
                onChangeText={(v) => patch('name', v)}
                style={styles.input}
                placeholder="Jane Doe"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                autoFocus
              />
            </Field>
            <Field label="Email *">
              <TextInput
                value={account.email}
                onChangeText={(v) => patch('email', v)}
                style={styles.input}
                placeholder="jane@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Field>
            <Field label="Location / City">
              <TextInput
                value={account.location}
                onChangeText={(v) => patch('location', v)}
                style={styles.input}
                placeholder="Berlin"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
            </Field>

            {account.type === 'business' && (
              <>
                <Field label="Company Name *">
                  <TextInput
                    value={account.company}
                    onChangeText={(v) => patch('company', v)}
                    style={styles.input}
                    placeholder="Acme Corp"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="words"
                  />
                </Field>
                <Field label="Industry">
                  <View style={styles.chipWrap}>
                    {SUGGESTED_INDUSTRIES.map((i) => (
                      <Pressable
                        key={i}
                        onPress={() => patch('industry', account.industry === i ? '' : i)}
                        style={[styles.chip, account.industry === i && styles.chipActive]}
                      >
                        <Text style={[styles.chipLabel, account.industry === i && styles.chipLabelActive]}>{i}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Field>
                <Field label="Website">
                  <TextInput
                    value={account.website}
                    onChangeText={(v) => patch('website', v)}
                    style={styles.input}
                    placeholder="acme.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </Field>
                <Field label="What you sell">
                  <TextInput
                    value={account.description}
                    onChangeText={(v) => patch('description', v)}
                    style={[styles.input, styles.multiline]}
                    placeholder="B2B supply-chain analytics for mid-market manufacturers"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                  />
                </Field>
              </>
            )}

            {account.type === 'customer' && (
              <Field label="What are you interested in?">
                <Text style={styles.hint}>Pick any that apply — we'll surface relevant fairs and exhibitors.</Text>
                <View style={[styles.chipWrap, { marginTop: 8 }]}>
                  {SUGGESTED_INDUSTRIES.map((i) => {
                    const selected = account.interests.includes(i);
                    return (
                      <Pressable
                        key={i}
                        onPress={() => toggleInterest(i)}
                        style={[styles.chip, selected && styles.chipActive]}
                      >
                        <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{i}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>
            )}

            <Pressable onPress={() => setStep('type')} style={styles.switchBtn}>
              <Icon name="swap-horizontal" size={14} color={colors.primary} />
              <Text style={styles.switchText}>
                Switch to {account.type === 'business' ? 'Customer' : 'Business'} mode
              </Text>
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[typography.sectionLabel, { marginBottom: 6 }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  headerAction: { fontSize: 16, color: colors.primary },
  scroll: { padding: 16, paddingBottom: 60 },
  intro: { ...typography.callout, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  bigCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...elevation.card,
  },
  bigCardActive: { borderColor: colors.primary },
  bigCardIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  bigCardTitle: { ...typography.headline, color: colors.textPrimary },
  bigCardBody: { ...typography.tertiary, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  note: { ...typography.tertiary, color: colors.textSecondary, textAlign: 'center', marginTop: 18, paddingHorizontal: 16 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  hint: { ...typography.tertiary, color: colors.textSecondary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipLabelActive: { color: colors.primary },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 6,
  },
  switchText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});
