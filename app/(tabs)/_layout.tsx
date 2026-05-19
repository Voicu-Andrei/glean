import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon, type IconName } from '../../src/components/Icon';
import { colors, elevation } from '../../src/theme';
import { useIncompleteCount } from '../../src/hooks/useContacts';
import { tap } from '../../src/utils/haptics';

function tabIcon(focused: IconName, blurred: IconName) {
  return ({ color, focused: f }: { color: string; focused: boolean }) => (
    <Icon name={f ? focused : blurred} size={22} color={color} />
  );
}

function CenterTabButton({ onPress, accessibilityState }: {
  onPress?: () => void;
  accessibilityState?: { selected?: boolean };
}) {
  const selected = accessibilityState?.selected;
  return (
    <View style={styles.centerWrap} pointerEvents="box-none">
      <Pressable
        onPress={() => {
          tap();
          onPress?.();
        }}
        style={[styles.centerBtn, selected && styles.centerBtnActive]}
        accessibilityRole="button"
        accessibilityLabel="Dashboard"
      >
        <Icon name="grid" size={24} color={colors.surface} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { count } = useIncompleteCount();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSoft,
          borderTopWidth: 0.5,
          height: 84,
          paddingTop: 6,
          paddingBottom: 28,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.2 },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Contacts',
          tabBarIcon: tabIcon('people', 'people-outline'),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: tabIcon('calendar', 'calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: '',
          tabBarButton: (props) => (
            <CenterTabButton
              onPress={props.onPress as () => void}
              accessibilityState={props.accessibilityState as { selected?: boolean }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="incomplete"
        options={{
          title: 'Drafts',
          tabBarIcon: tabIcon('create', 'create-outline'),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            color: colors.surface,
            fontSize: 10,
            fontWeight: '700',
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: tabIcon('settings', 'settings-outline'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerBtn: {
    position: 'absolute',
    top: -22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.fab,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  centerBtnActive: { backgroundColor: colors.primaryDark },
});
