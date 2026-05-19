import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import { getDb } from '../src/db';
import { colors, typography } from '../src/theme';

enableScreens(false);

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await getDb();
        if (mounted) setReady(true);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.splash}>
        <Image source={require('../assets/icon.png')} style={styles.splashLogo} />
        <Text style={styles.brand}>Glean</Text>
        <Text style={styles.errTitle}>Could not open database</Text>
        <Text style={styles.errMsg}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.splash}>
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
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="contact/new" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="contact/[id]" />
        <Stack.Screen name="contact/edit/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event/[id]" />
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
