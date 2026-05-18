import { Tabs } from 'expo-router';
import { Icon, type IconName } from '../../src/components/Icon';
import { colors } from '../../src/theme';
import { useIncompleteCount } from '../../src/hooks/useContacts';

function tabIcon(focused: IconName, blurred: IconName) {
  return ({ color, focused: f }: { color: string; focused: boolean }) => (
    <Icon name={f ? focused : blurred} size={22} color={color} />
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
        name="incomplete"
        options={{
          title: 'To Finish',
          tabBarIcon: tabIcon('alert-circle', 'alert-circle-outline'),
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
