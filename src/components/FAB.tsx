import { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { colors, elevation } from '../theme';
import { tap } from '../utils/haptics';
import { Icon, type IconName } from './Icon';

type Props = {
  onPress: () => void;
  icon?: IconName;
  label?: string;
};

export function FAB({ onPress, icon = 'add', label }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();

  return (
    <Animated.View style={[styles.fabWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => {
          tap();
          onPress();
        }}
        onPressIn={() => animateTo(0.9)}
        onPressOut={() => animateTo(1)}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Add'}
      >
        <Icon name={icon} size={28} color={colors.surface} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    ...elevation.fab,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
