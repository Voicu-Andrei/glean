import { useMemo } from 'react';
import { Platform, StatusBar, StyleSheet, View, type ViewProps } from 'react-native';
import Constants from 'expo-constants';

export function Screen({ children, style, ...props }: ViewProps & { children: React.ReactNode }) {
  const paddingTop = useMemo(() => {
    if (Platform.OS === 'ios') {
      return Constants.statusBarHeight ?? 44;
    }
    return StatusBar.currentHeight ?? 0;
  }, []);
  return (
    <View style={[styles.flex, { paddingTop }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
