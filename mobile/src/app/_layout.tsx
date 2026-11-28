import React, { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';
import { C, F } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => null);

function Gate() {
  const { ready, signedIn } = useAuth();
  const segments = useSegments();
  useEffect(() => {
    if (!ready) return;
    const onLogin = segments[0] === 'login';
    if (!signedIn && !onLogin) router.replace('/login');
    else if (signedIn && onLogin) router.replace('/');
    SplashScreen.hideAsync().catch(() => null);
  }, [ready, signedIn, segments]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontFamily: F.medium, fontSize: 16, color: C.text },
        headerTintColor: C.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="web" options={{ title: '' }} />
      <Stack.Screen name="market-item" options={{ title: 'Marketplace' }} />
      <Stack.Screen name="viewer" options={{ title: '', presentation: 'fullScreenModal', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
  });
  if (!loaded) return null;
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Gate />
    </AuthProvider>
  );
}
