import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

// Frame-rate / driver-friendly paint splatter:
//  0–500ms:  v1 logo (cream + teal G) sits + breathes
//  500–1100ms: splatter blobs scale + rotate around the logo
//  900–1400ms: background fades teal, v1 fades out, v2 fades in
//  1400ms+: v2 logo (teal + white G) settles
//
// All animations use Animated.timing with useNativeDriver: true.

const SPLAT_COLORS = ['#D4820A', '#5B7FA6', '#2E7D32', '#C73E1D', '#6A1B9A', '#F2A93B'];

// Polar positions for each splatter blob (degrees, distance multiplier)
const SPLATS: Array<{ angle: number; dist: number; size: number; delay: number }> = [
  { angle: 25,  dist: 70,  size: 36, delay: 0 },
  { angle: 95,  dist: 80,  size: 28, delay: 60 },
  { angle: 165, dist: 65,  size: 42, delay: 120 },
  { angle: 215, dist: 78,  size: 30, delay: 40 },
  { angle: 285, dist: 72,  size: 38, delay: 100 },
  { angle: 335, dist: 68,  size: 26, delay: 80 },
];

type Props = { brand?: boolean };

export function SplashAnimation({ brand = true }: Props) {
  const v1Opacity = useRef(new Animated.Value(1)).current;
  const v2Opacity = useRef(new Animated.Value(0)).current;
  const bgTeal = useRef(new Animated.Value(0)).current; // 0 cream -> 1 teal
  const logoBreath = useRef(new Animated.Value(1)).current;
  const splatScales = useRef(SPLATS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Breathing pulse on initial logo
    Animated.sequence([
      Animated.timing(logoBreath, { toValue: 1.04, duration: 280, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(logoBreath, { toValue: 1, duration: 220, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
    ]).start();

    // Splatter
    const splatAnims = splatScales.map((v, i) =>
      Animated.sequence([
        Animated.delay(500 + SPLATS[i].delay),
        Animated.timing(v, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(splatAnims).start();

    // Crossfade + bg morph
    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(bgTeal, { toValue: 1, duration: 500, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(v1Opacity, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(v2Opacity, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ]),
    ]).start();
  }, [bgTeal, logoBreath, splatScales, v1Opacity, v2Opacity]);

  const bgInterp = bgTeal.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.primary],
  });

  const brandColor = bgTeal.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.primary, colors.surface],
  });

  return (
    <Animated.View style={[styles.root, { backgroundColor: bgInterp }]}>
      <View style={styles.center}>
        {SPLATS.map((s, i) => {
          const x = Math.cos((s.angle * Math.PI) / 180) * s.dist;
          const y = Math.sin((s.angle * Math.PI) / 180) * s.dist;
          return (
            <Animated.View
              key={i}
              style={[
                styles.splat,
                {
                  width: s.size,
                  height: s.size,
                  borderRadius: s.size / 2,
                  backgroundColor: SPLAT_COLORS[i % SPLAT_COLORS.length],
                  transform: [
                    { translateX: x },
                    { translateY: y },
                    { scale: splatScales[i] },
                  ],
                  opacity: splatScales[i].interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.95, 0.75] }),
                },
              ]}
            />
          );
        })}

        <Animated.Image
          source={require('../../assets/logo-v1.png')}
          style={[
            styles.logo,
            { opacity: v1Opacity, transform: [{ scale: logoBreath }] },
          ]}
        />
        <Animated.Image
          source={require('../../assets/logo-v2.png')}
          style={[styles.logo, styles.logoAbsolute, { opacity: v2Opacity }]}
        />
      </View>

      {brand && (
        <View style={styles.brandWrap}>
          <Animated.Text style={[styles.brand, { color: brandColor }]}>Glean</Animated.Text>
          <Animated.Text style={[styles.tagline, { color: brandColor, opacity: 0.7 }]}>
            Capture every connection
          </Animated.Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  center: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 110, height: 110, borderRadius: 26 },
  logoAbsolute: { position: 'absolute' },
  splat: { position: 'absolute' },
  brandWrap: { alignItems: 'center', marginTop: 28 },
  brand: { ...typography.largeTitle, letterSpacing: 0.5 },
  tagline: { ...typography.callout, marginTop: 6 },
});
