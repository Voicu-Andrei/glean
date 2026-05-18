import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F2' }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A6B6B' }}>Glean</Text>
      <Text style={{ fontSize: 14, color: '#6E6E73', marginTop: 8 }}>Bare RN — no router</Text>
      <StatusBar style="dark" />
    </View>
  );
}
