import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import * as SplashScreen from 'expo-splash-screen';
import { getDb } from '../src/db';
import { autoBalanceActiveEvent } from '../src/db/events';
import { colors, typography } from '../src/theme';

enableScreens(false);

// Keep the native splash visible while we init; minimum visible time below.
SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_SPLASH_MS = 900;

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const startedAt = Date.now();
    (async () => {
      try {
        await getDb();
        await autoBalanceActiveEvent();
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

  const onLayoutHide = useCallback(() => {
    if (ready || error) SplashScreen.hideAsync().catch(() => {});
  }, [ready, error]);

  if (error) {
    return (
      <View style={styles.splash} onLayout={onLayoutHide}>
        <Image source={require('../assets/icon.png')} style={styles.splashLogo} />
        <Text style={styles.brand}>Glean</Text>
        <Text style={styles.errTitle}>Could not open database</Text>
        <Text style={styles.errMsg}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.splash} onLayout={onLayoutHide}>
        <Image source={require('../assets/icon.png')} style={styles.splashLogo} />
        <Text style={styles.brand}>Glean</Text>
        <Text style={styles.tagline}>Capture every connection</Text>
        <View style={{ marginTop: 24 }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutHide}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="contact/new" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="contact/[id]" />
        <Stack.Screen name="contact/edit/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="settings/my-card" options={{ presentation: 'modal' }} />
        <Stack.Screen name="scan" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
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
  splashLogo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    marginBottom: 18,
  },
  brand: {
    ...typography.largeTitle,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    ...typography.callout,
    color: colors.textSecondary,
    marginTop: 6,
  },
  errTitle: { fontSize: 16, fontWeight: '700', color: colors.danger, marginTop: 18, marginBottom: 6 },
  errMsg: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
