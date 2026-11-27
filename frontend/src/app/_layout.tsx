import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BackButton from "../components/BackButton";
import { AuthProvider, useAuth } from "../context/AuthContext";

// Halaman yang boleh dibuka tanpa login
const PUBLIC_ROUTES = ["splash", "index", "register", "lupa-password"];
// Halaman yang tidak perlu dibuka lagi kalau sudah login
const AUTH_ONLY_GUEST_ROUTES = ["index", "register"];
// Halaman tujuan setelah login berhasil
const HOME_ROUTE = "/dashboard";

function RootNavigator() {
  const { user, loading } = useAuth() as any;
  const segments = useSegments();
  const router = useRouter();
  const lastRedirect = useRef<string | null>(null);

  const first = (segments[0] as string | undefined) ?? "index";
  const isLoggedIn = !!user?.uid;

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_ROUTES.includes(first);

    let target: string | null = null;
    if (!isLoggedIn && !isPublic) {
      target = "/";
    } else if (isLoggedIn && AUTH_ONLY_GUEST_ROUTES.includes(first)) {
      target = HOME_ROUTE;
    }

    if (!target) {
      lastRedirect.current = null;
      return;
    }

    // Cegah redirect yang sama dikirim berulang (penyebab loop)
    const key = `${isLoggedIn}:${first}->${target}`;
    if (lastRedirect.current === key) return;
    lastRedirect.current = key;

    router.replace(target as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, loading, first]);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => <BackButton />,
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#ffffff" },
          gestureEnabled: true,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "#ffffff" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />

        <Stack.Screen name="register" options={{ title: "Daftar" }} />
        <Stack.Screen name="lupa-password" options={{ title: "Lupa Kata Sandi" }} />
      </Stack>

      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}