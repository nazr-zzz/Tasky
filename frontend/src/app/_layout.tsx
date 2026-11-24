import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          // Semua layar otomatis punya header + tombol kembali
          headerShown: true,
          headerBackVisible: false, // sembunyikan tombol bawaan agar tidak dobel
          headerLeft: () => <BackButton label="" />,
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          gestureEnabled: true,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#ffffff' },
        }}
      >
        {/* Layar utama: tanpa header dan tombol kembali */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />

        {/* Layar yang dibuka dari layar lain: ada tombol kembali */}
        <Stack.Screen name="register" options={{ title: 'Daftar' }} />
        <Stack.Screen name="lupa-password" options={{ title: 'Lupa Kata Sandi' }} />
      </Stack>
    </SafeAreaProvider>
  );
}