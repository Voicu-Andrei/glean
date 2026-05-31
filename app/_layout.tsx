import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import { getDb } from '../src/db';
import { SplashAnimation } from '../src/components/SplashAnimation';
import { colors } from '../src/theme';

enableScreens(false);

const MIN_SPLASH_MS = 1100;

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const startedAt = Date.now();
    (async () => {
      try {
        await getDb();
        try {
          const mod = await import('../src/db/events');
          await mod.autoBalanceActiveEvent();
        } catch {
          // non-fatal — manual activation still works
        }
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, MIN_SPLASH_MS - elapsed);
        if (wait) await new Promise((r) => setTimeout(r, wait));
        if (mounted) setReady(true);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (error) {
    return (
      <View style={styles.splash}>
        <Text style={styles.errTitle}>Could not open database</Text>
        <Text style={styles.errMsg}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return <SplashAnimation />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="contact/new" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="contact/[id]" />
        <Stack.Screen name="contact/edit/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="settings/my-card" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account/register" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account/tags" />
        <Stack.Screen name="account/about" />
        <Stack.Screen name="scan" options={{ presentation: 'modal' }} />
        <Stack.Screen name="meetings" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  errTitle: { fontSize: 16, fontWeight: '700', color: colors.danger, marginTop: 18, marginBottom: 6 },
  errMsg: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
